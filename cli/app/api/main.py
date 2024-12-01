import json
import os
import shutil
from http.client import HTTPException

import docker
from app.api.utils import (
    create_machine_config,
    run_code_in_container,
    save_uploaded_file,
)
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIRECTORY = "uploads"
client = docker.from_env()


@app.post("/upload")
async def process_upload(
    machines: str = Form(...),
    language: str = Form(...),
    entryPoint: str = Form(...),
    files: list[UploadFile] = File(...),
):
    """
    Process the uploaded files and generate a CSV report.
    """

    base_folder_path = "uploads/uploaded_files"
    output_file = "tin-report.csv"

    current_dir = os.path.dirname(__file__)
    public_folder = os.path.abspath(
        os.path.join(current_dir, "..", "..", "..", "frontend", "public")
    )

    os.makedirs(public_folder, exist_ok=True)

    public_csv_path = os.path.join(public_folder, "tin-report.csv")

    saved_files = []

    for file in files:
        try:
            saved_location = save_uploaded_file(base_folder_path, file)
            saved_files.append(saved_location)
        except HTTPException:
            print(f"Failed to upload {file.filename}")

    try:
        machines_list = json.loads(machines)
        machine_configs = create_machine_config(machines_list)
        print(f"Using machine configurations: {machine_configs}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid machines format.")

    run_code_in_container(machine_configs, base_folder_path, language, entryPoint)

    if not os.path.exists(output_file):
        raise HTTPException(status_code=404, detail="CSV file not generated")

    try:
        shutil.copy(output_file, public_csv_path)
        print(f"CSV copied to {public_csv_path}")
    except Exception as e:
        print(f"Error copying CSV to public folder: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to copy CSV: {str(e)}")

    try:
        for saved_file in saved_files:
            os.remove(saved_file)
            print(f"Removed uploaded file: {saved_file}")

        shutil.rmtree(base_folder_path, ignore_errors=True)
        print(f"Cleaned up folder: {base_folder_path}")

        if os.path.exists(output_file):
            os.remove(output_file)
            print(f"Removed generated CSV file: {output_file}")
    except Exception as e:
        print(f"Error during cleanup: {e}")

    return {"message": "CSV saved to public folder", "path": "tin-report.csv"}
