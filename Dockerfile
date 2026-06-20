FROM python:3.9-slim

# Set work directory
WORKDIR /code

# Copy requirements
COPY requirements_prod.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the application
COPY . /code/

# Set permissions for the directory
RUN chmod -R 777 /code

# Start command (Hugging Face uses port 7860)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
