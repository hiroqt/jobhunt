import io
from typing import Tuple, Optional
from pypdf import PdfReader
from backend.app.core.logging import logger


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> Tuple[bool, str, Optional[str]]:
    """
    Extracts plain text from raw PDF file bytes.
    Returns: (success, extracted_text, error_message)
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text_parts = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text)
                
        full_text = "\n\n".join(text_parts)
        if not full_text.strip():
            return False, "", "Could not extract text from the PDF. It may be an image scan or password-protected."
            
        return True, full_text.strip(), None
    except Exception as e:
        logger.warning(f"Error reading PDF bytes: {e}")
        return False, "", f"Failed to parse PDF document: {str(e)}"
