import asyncio
import logging
import random
import os
import numpy as np
import time
from pathlib import Path
from typing import Optional, List

import cv2

# ============================================
# FORCE DETERMINISTIC BEHAVIOR
# ============================================
os.environ['OPENCV_OPENCL_RUNTIME'] = ''
os.environ['OPENCV_ENABLE_MEMORY_SANITIZER'] = '1'
random.seed(42)
np.random.seed(42)
cv2.setRNGSeed(42)

from app.config import get_settings
from app.services.alignment import align_images
from app.services.ocr_service import run_dual_ocr, diff_text_regions
from app.services.color_service import analyze_color_zones
from app.services.ssim_service import detect_defects
from app.services.preprocess import rasterize_pdf, preprocess_image
from app.services.advanced_inspection import (
    verify_font_sizes, spell_check_regions, detect_smear_and_banding,
)
from app.services.pantone_service import identify_pantone_colors_in_image
from app.services.icon_size_check import compare_icon_sizes
from app.services.expiry_date_validator import validate_expiry_dates

log = logging.getLogger(__name__)
settings = get_settings()


class PrepressError(Exception):
    pass


class PrepressInspectionEngine:
    """
    Compares one or more trial proof prints against the final design.
    Produces a real-time accuracy report and GO/NO-GO recommendation.
    """

    async def compare_trial_to_final(
        self,
        job_id: str,
        final_design_path: str,
        trial_proof_paths: List[str],
        config: dict,
        progress_callback=None,
    ) -> dict:
        """
        Run prepress comparison.

        Config:
            - color_threshold: ΔE limit (default 2.0)
            - identify_pantones: bool (run Pantone identification on final)
            - check_expiry_dates: bool
            - check_icon_sizes: bool
            - min_font_size_pt: float (GMP minimum)
            - waste_estimate: dict {"unit_cost_per_m2": ..., "expected_run_m2": ...}
        """
        start_time = time.time()
        log.info(f"[{job_id}] Prepress trial-vs-final inspection starting")

        try:
            # ── Load files ────────────────────────────────────────────────────
            final_path = await self._prepare_file(final_design_path, "final_design")
            final_img = cv2.imread(str(final_path))
            if final_img is None:
                raise PrepressError("Cannot load final design image")

            trial_imgs = []
            for tp in trial_proof_paths:
                tp_path = await self._prepare_file(tp, "trial_proof")
                ti = cv2.imread(str(tp_path))
                if ti is not None:
                    trial_imgs.append((str(tp_path), ti))

            if not trial_imgs:
                raise PrepressError("No trial proof images could be loaded")

            log.info(f"[{job_id}] Final design + {len(trial_imgs)} trial proof(s) loaded")

            # ── Run identification on final design (Pantone) ──────────────────
            final_pantones = None
            if config.get("identify_pantones", True):
                final_pantones = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: identify_pantone_colors_in_image(final_img, k=8)
                )

            # ── Inspect each trial proof against final ────────────────────────
            trial_reports = []
            for idx, (path, trial_img) in enumerate(trial_imgs, 1):
                log.info(f"[{job_id}] Inspecting trial proof {idx}/{len(trial_imgs)}")
                report = await self._inspect_one_trial(
                    final_img=final_img,
                    trial_img=trial_img,
                    trial_path=path,
                    trial_idx=idx,
                    final_pantones=final_pantones,
                    config=config,
                )
                trial_reports.append(report)

            # Sort trial reports deterministically by index
            trial_reports.sort(key=lambda x: x["trial_idx"])

            # ── Aggregate ─────────────────────────────────────────────────────
            best_trial = max(trial_reports, key=lambda r: r["accuracy_score"])
            worst_trial = min(trial_reports, key=lambda r: r["accuracy_score"])
            avg_accuracy = sum(r["accuracy_score"] for r in trial_reports) / len(trial_reports)

            # ── GO/NO-GO Decision ──────────────────────────────────────────────
            min_required = config.get("min_accuracy_for_go", 90.0)
            decision = self._make_decision(trial_reports, min_required)

            # ── Waste prediction ──────────────────────────────────────────────
            waste = self._estimate_waste_savings(trial_reports, config)

            # ── Final result ──────────────────────────────────────────────────
            result = {
                "job_id": job_id,
                "mode": "prepress_trial_comparison",
                "decision": decision["decision"],  # GO | HOLD | NO_GO
                "decision_reason": decision["reason"],
                "decision_severity": decision["severity"],  # critical | warning | info
                "accuracy_score": round(avg_accuracy, 2),
                "best_trial_score": round(best_trial["accuracy_score"], 2),
                "worst_trial_score": round(worst_trial["accuracy_score"], 2),
                "trial_count": len(trial_reports),
                "trial_reports": trial_reports,
                "final_pantones": final_pantones,
                "waste_savings": waste,
                "processing_time_ms": int((time.time() - start_time) * 1000),
            }

            log.info(
                f"[{job_id}] Prepress complete: decision={decision['decision']}, "
                f"avg_accuracy={avg_accuracy:.1f}%, "
                f"waste_savings=${waste.get('estimated_savings_usd', 0):.0f}"
            )
            return result

        except PrepressError:
            raise
        except Exception as e:
            log.exception(f"[{job_id}] Prepress error: {e}")
            raise PrepressError(f"Prepress inspection failed: {e}")

    # ── Single Trial Comparison ────────────────────────────────────────────────

    async def _inspect_one_trial(
        self, final_img, trial_img, trial_path, trial_idx, final_pantones, config,
    ) -> dict:
        """Compare ONE trial proof against the final design"""
        loop = asyncio.get_event_loop()

        # Align trial to final
        aligned, align_conf = await loop.run_in_executor(
            None, lambda: align_images(final_img, trial_img)
        )
        if align_conf < 0.15:
            log.warning(f"Trial {trial_idx} alignment poor: conf={align_conf:.2f}")

        # OCR diff
        ocr_errors = []
        ocr_regions_final = []
        ocr_regions_trial = []
        try:
            tmp_dir = Path(settings.temp_dir)
            tmp_dir.mkdir(parents=True, exist_ok=True)
            f_path = tmp_dir / f"prepress_final_{trial_idx}.png"
            t_path = tmp_dir / f"prepress_trial_{trial_idx}.png"
            cv2.imwrite(str(f_path), final_img)
            cv2.imwrite(str(t_path), aligned)

            ocr_result = await loop.run_in_executor(
                None, lambda: run_dual_ocr(str(f_path), str(t_path))
            )
            ocr_regions_final = ocr_result.get("master_regions", [])
            ocr_regions_trial = ocr_result.get("scan_regions", [])
            ocr_errors = diff_text_regions(ocr_regions_final, ocr_regions_trial)

            # Sort OCR errors deterministically
            ocr_errors.sort(key=lambda x: (x.get("bbox", {}).get("y", 0), x.get("bbox", {}).get("x", 0)))

            try:
                f_path.unlink(); t_path.unlink()
            except Exception:
                pass
        except Exception as e:
            log.warning(f"Trial {trial_idx} OCR failed: {e}")

        # Color analysis
        color_result = await loop.run_in_executor(
            None, lambda: analyze_color_zones(
                final_img, aligned,
                threshold=config.get("color_threshold", 2.0),
            )
        )

        # SSIM defects
        ssim_result = await loop.run_in_executor(
            None, lambda: detect_defects(
                final_img, aligned,
                threshold=config.get("ssim_threshold", 0.75),
            )
        )

        # Smear / banding
        smear_banding = await loop.run_in_executor(
            None, lambda: detect_smear_and_banding(final_img, aligned)
        )

        # Font size verification
        font_size = None
        if config.get("check_font_size", True):
            font_size = verify_font_sizes(
                ocr_regions_trial, dpi=300,
                min_pt=config.get("min_font_size_pt", 6.0),
            )

        # Spell check
        spell = None
        if config.get("spell_check", True):
            spell = spell_check_regions(ocr_regions_trial)

        # Icon / logo size verification
        icon_size = None
        if config.get("check_icon_sizes", True):
            icon_size = await loop.run_in_executor(
                None, lambda: compare_icon_sizes(final_img, aligned)
            )

        # Expiry date validation
        expiry = None
        if config.get("check_expiry_dates", True):
            # Combine text from all regions
            trial_text = " ".join(r.get("text", "") for r in ocr_regions_trial)
            final_text = " ".join(r.get("text", "") for r in ocr_regions_final)
            expiry = validate_expiry_dates(trial_text, final_text)

        # ── Compute trial accuracy score ──────────────────────────────────────
        scores = self._compute_accuracy_score(
            ocr_errors=ocr_errors,
            color_result=color_result,
            ssim_result=ssim_result,
            font_size=font_size,
            spell=spell,
            icon_size=icon_size,
            expiry=expiry,
            smear_banding=smear_banding,
        )

        # ── Categorize errors ─────────────────────────────────────────────────
        error_summary = self._categorize_errors(
            ocr_errors=ocr_errors,
            color_result=color_result,
            ssim_result=ssim_result,
            font_size=font_size,
            spell=spell,
            icon_size=icon_size,
            expiry=expiry,
        )

        # ── Save annotated trial image ─────────────────────────────────────────
        timestamp = int(time.time())
        annotated = self._create_trial_annotation(
            final_img, aligned, ocr_errors, color_result, ssim_result, error_summary,
        )
        out_path = Path(settings.reports_dir) / f"prepress_trial_{trial_idx}_{timestamp}.jpg"
        cv2.imwrite(str(out_path), annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])

        return {
            "trial_idx": trial_idx,
            "trial_path": trial_path,
            "alignment_confidence": round(align_conf, 3),
            "accuracy_score": round(scores["overall"], 2),
            "scores": scores,
            "passed": scores["overall"] >= config.get("min_accuracy_for_go", 90.0),
            "ocr_errors": ocr_errors,
            "ocr_error_count": len(ocr_errors),
            "color_zone_failures": color_result.get("failures", 0),
            "color_mean_delta_e": color_result.get("mean_delta_e", 0),
            "ssim_score": ssim_result.get("ssim_score", 1.0),
            "defects": ssim_result.get("defects", []),
            "defect_count": len(ssim_result.get("defects", [])),
            "smear_banding": smear_banding,
            "font_size": font_size,
            "spell_check": spell,
            "icon_size": icon_size,
            "expiry_date": expiry,
            "error_summary": error_summary,
            "annotated_path": str(out_path),
        }

    # ... rest of the class methods remain the same ...
    # (keep all your existing methods: _compute_accuracy_score, _categorize_errors, 
    #  _make_decision, _estimate_waste_savings, _create_trial_annotation, _prepare_file)

    # ── Scoring ────────────────────────────────────────────────────────────────

    def _compute_accuracy_score(
        self, ocr_errors, color_result, ssim_result,
        font_size, spell, icon_size, expiry, smear_banding,
    ) -> dict:
        # ... (keep your existing implementation) ...
        pass

    # ── Error Categorization ───────────────────────────────────────────────────

    def _categorize_errors(self, ocr_errors, color_result, ssim_result,
                           font_size, spell, icon_size, expiry) -> dict:
        # ... (keep your existing implementation) ...
        pass

    # ── Decision Engine ────────────────────────────────────────────────────────

    def _make_decision(self, trial_reports, min_required) -> dict:
        # ... (keep your existing implementation) ...
        pass

    # ── Waste Prediction ───────────────────────────────────────────────────────

    def _estimate_waste_savings(self, trial_reports, config) -> dict:
        # ... (keep your existing implementation) ...
        pass

    # ── Annotation ─────────────────────────────────────────────────────────────

    def _create_trial_annotation(
        self, final_img, aligned_trial, ocr_errors, color_result, ssim_result,
        error_summary,
    ) -> np.ndarray:
        # ... (keep your existing implementation) ...
        pass

    async def _prepare_file(self, file_path: str, role: str) -> Path:
        # ... (keep your existing implementation) ...
        pass


# Singleton
_prepress_engine: Optional[PrepressInspectionEngine] = None

def get_prepress_engine() -> PrepressInspectionEngine:
    global _prepress_engine
    if _prepress_engine is None:
        _prepress_engine = PrepressInspectionEngine()
    return _prepress_engine