"""
THIS FUNCTIONALITY HAS NOT BEEN TESTED YET
"""

import argparse
import asyncio
import atexit
import logging
import os
from io import StringIO

import pandas as pd
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

app = FastAPI()

# Add CORS middleware with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


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
        logger.info(f"CSV Data preview: {request.csv_data[:200]}")

        if not request.csv_data or not request.user_prompt:
            logger.error("Missing required data")
            raise HTTPException(
                status_code=400, detail="Missing required data in request"
            )

        # Parse CSV data to make sure it's valid
        try:
            csv_io = StringIO(request.csv_data)
            df = pd.read_csv(csv_io)
            logger.info(f"Successfully parsed CSV data with {len(df)} rows")
            logger.info(f"Columns: {df.columns.tolist()}")
            logger.info(f"First row: {df.iloc[0].to_dict()}")
        except Exception as e:
            logger.error(f"CSV parsing error: {str(e)}")
            logger.error(f"CSV data preview: {request.csv_data[:200]}")
            raise HTTPException(
                status_code=400, detail=f"Failed to parse CSV data: {str(e)}"
            )

        try:
            response = await chat_interaction.generate_response(
                request.csv_data, request.user_prompt
            )
            logger.info("Successfully generated response")
            logger.info(f"Response preview: {response[:200]}")
            return {"response": response}
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to generate response: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


async def cli_chat(question: str, csv_path: str = "testdata.csv"):
    """Handle command line chat interactions"""
    try:
        # Read CSV file
        if not os.path.exists(csv_path):
            print(f"Error: CSV file not found at {csv_path}")
            return

        with open(csv_path, "r") as file:
            csv_data = file.read()

        # Generate response
        response = await chat_interaction.generate_response(csv_data, question)
        print("\nResponse:")
        print("-" * 80)
        print(response)
        print("-" * 80)

    except Exception as e:
        print(f"Error: {str(e)}")


def save_pid():
    """Save the current process ID to a file"""
    pid = os.getpid()
    pid_file = os.path.join(os.path.dirname(__file__), ".server.pid")
    with open(pid_file, "w") as f:
        f.write(str(pid))


def cleanup_pid():
    """Remove the PID file when the server stops"""
    pid_file = os.path.join(os.path.dirname(__file__), ".server.pid")
    if os.path.exists(pid_file):
        os.remove(pid_file)


def main():
    parser = argparse.ArgumentParser(
        description="GPT Assistant for analyzing OS performance data"
    )
    parser.add_argument("--server", action="store_true", help="Run as FastAPI server")
    parser.add_argument(
        "--question", "-q", type=str, help="Question to ask about the data"
    )
    parser.add_argument(
        "--csv",
        type=str,
        default="testdata.csv",
        help="Path to CSV file (default: testdata.csv)",
    )
    parser.add_argument("--stop", action="store_true", help="Stop the running server")

    args = parser.parse_args()

    if args.stop:
        pid_file = os.path.join(os.path.dirname(__file__), ".server.pid")
        if os.path.exists(pid_file):
            with open(pid_file, "r") as f:
                pid = int(f.read().strip())
            try:
                os.kill(pid, 15)  # Send SIGTERM
                cleanup_pid()
                print("Server stopped successfully")
            except ProcessLookupError:
                cleanup_pid()
                print("Server was not running")
            except Exception as e:
                print(f"Error stopping server: {e}")
        else:
            print("No running server found")
        return

    if args.server:
        # Save PID when running as server
        save_pid()
        atexit.register(cleanup_pid)
        logger.info("Starting FastAPI server on port 5000")
        uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
    elif args.question:
        asyncio.run(cli_chat(args.question, args.csv))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
