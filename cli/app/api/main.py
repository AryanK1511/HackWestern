import json
import os
import shutil
from http.client import HTTPException
from io import StringIO
import logging
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv

import docker
from app.api.utils import (
    create_machine_config,
    run_code_in_container,
    save_uploaded_file,
)
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

UPLOAD_DIRECTORY = "uploads"
client = docker.from_env()

# AI Chat Classes and Routes
class ChatRequest(BaseModel):
    csv_data: str
    user_prompt: str

class ChatGPTInteraction:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=api_key)
        self.conversation_history = []

    async def generate_response(self, csv_data: str, user_prompt: str) -> str:
        try:
            logger.info(f"Generating response for prompt: {user_prompt}")
            self.conversation_history.append({"role": "user", "content": user_prompt})

            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful assistant analyzing data about the speed of different OS's.",
                },
                {
                    "role": "user",
                    "content": f"Here is the data to analyze in CSV format:\n{csv_data}",
                },
            ]
            messages.extend(self.conversation_history)

            response = self.client.chat.completions.create(
                model="gpt-4", messages=messages, temperature=0.7, max_tokens=4000
            )

            assistant_response = response.choices[0].message.content
            self.conversation_history.append(
                {"role": "assistant", "content": assistant_response}
            )
            logger.info("Successfully generated response")

            return assistant_response

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

chat_interaction = ChatGPTInteraction()

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        logger.info("Received chat request")
        logger.info(f"User prompt: {request.user_prompt}")
        logger.info(f"CSV Data length: {len(request.csv_data)}")

        if not request.csv_data or not request.user_prompt:
            logger.error("Missing required data")
            return {"error": "Missing required data in request"}, 400

        try:
            csv_io = StringIO(request.csv_data)
            df = pd.read_csv(csv_io)
            logger.info(f"Successfully parsed CSV data with {len(df)} rows")
        except Exception as e:
            logger.error(f"CSV parsing error: {str(e)}")
            return {"error": f"Failed to parse CSV data: {str(e)}"}, 400

        try:
            response = await chat_interaction.generate_response(
                request.csv_data, request.user_prompt
            )
            logger.info("Successfully generated response")
            return {"response": response}
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {"error": f"Failed to generate response: {str(e)}"}, 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}, 500

# File Upload Route
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
