# CLI Tool

CLI Tool for HackWestern.

## Running This Tool Locally Using Poetry

To run the CLI tool locally using **Poetry**, follow the steps below. Poetry is a dependency manager for Python that helps to handle package management and virtual environments for your project.

### Prerequisites

Before running the tool locally, ensure you have the following installed:

- **Poetry**: A tool for dependency management and packaging in Python.
  - Install Poetry by following the instructions on the official site: [Poetry Installation Guide](https://python-poetry.org/docs/#installation)

### Steps to Run Locally

1. **Clone the Repository (If you haven't already)**

   If you haven't cloned the repository yet, use the following command to clone it:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**

   Poetry manages dependencies through the `pyproject.toml` file. To install all the required dependencies, run:

   ```bash
   poetry install
   ```

   **This command will:**

   - Create a virtual environment (if not already created).
   - Install all necessary dependencies specified in the `pyproject.toml` file.

3. **Activate the Virtual Environment**

   Poetry automatically creates a virtual environment for your project. To activate it, use the following command:

   ```bash
   poetry shell
   ```

   This will activate the virtual environment, and you can start working within it.

4. **Running the CLI Tool**

   Once the virtual environment is activated, you can run the CLI tool using:

   ```bash
   poetry run cli-tool <args>
   ```

   The tool will execute with the given input and provide the necessary output.

5. **Deactivating the Virtual Environment**

   After you’ve finished using the virtual environment, you can deactivate it by simply typing:

   ```bash
   exit
   ```

   This will return you to the global Python environment.
