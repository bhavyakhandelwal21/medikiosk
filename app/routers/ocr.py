import importlib.util
import os
import shutil
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/api", tags=["Prescription OCR"])
_ocr_module = None


def _load_ocr_module():
    global _ocr_module
    if _ocr_module is not None:
        return _ocr_module

    source = Path(__file__).resolve().parents[2] / "MediKiosk-OCR" / "app.py"
    spec = importlib.util.spec_from_file_location("medikiosk_legacy_ocr", source)
    if spec is None or spec.loader is None:
        raise RuntimeError("The OCR implementation could not be loaded.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    _ocr_module = module
    return module


@router.post("/ocr")
async def process_prescription_ocr(files: List[UploadFile] = File(...)):
    try:
        ocr_module = _load_ocr_module()
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="OCR dependencies or models are unavailable. Install the OCR requirements and retry.",
        ) from error

    upload_dir = Path(__file__).resolve().parents[2] / "uploads"
    upload_dir.mkdir(exist_ok=True)
    documents = []

    for file in files:
        filename = Path(file.filename or "document").name
        file_path = upload_dir / filename
        with file_path.open("wb") as output:
            shutil.copyfileobj(file.file, output)
        try:
            documents.append(ocr_module.process_file(str(file_path), filename))
        finally:
            file_path.unlink(missing_ok=True)

    return {"documents": documents}