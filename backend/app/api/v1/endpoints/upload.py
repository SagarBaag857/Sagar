from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter()

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size,
        "url": f"/uploads/{file.filename}"
    }