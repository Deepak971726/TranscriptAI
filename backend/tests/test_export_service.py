from pathlib import Path

from app.services.export_service import ExportService


def test_select_pdf_font_uses_script_specific_fonts() -> None:
    assert ExportService._select_pdf_font("Plain English text").endswith("NotoSans")
    assert ExportService._select_pdf_font("\u067e\u06c1 \u06a9\u0631\u0648\u06ba \u06af\u06d2").endswith("NotoSansArabic")
    assert ExportService._select_pdf_font("\u092a\u0930\u0940\u0915\u094d\u0937\u0923 \u0939\u093f\u0902\u0926\u0940").endswith(
        "NotoSansDevanagari"
    )
    assert ExportService._select_pdf_font("\u65e5\u672c\u8a9e\u306e\u6587\u5b57").endswith("NotoSansJP")


def test_write_pdf_embeds_unicode_font(test_settings, tmp_path: Path) -> None:
    service = ExportService(session=None, settings=test_settings)  # type: ignore[arg-type]
    path = tmp_path / "unicode-transcript.pdf"
    text = "\u067e\u06c1 \u06a9\u0631\u0648\u06ba \u06af\u06d2 \u0627\u06cc\u06a9 \u062f\u0646"

    service._write_pdf(path, "Unicode transcript", text)

    payload = path.read_bytes()
    assert payload.startswith(b"%PDF")
    assert len(payload) > 2_000
    assert b"NotoSansArabic" in payload
