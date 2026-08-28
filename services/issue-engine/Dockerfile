FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY *.py ./

EXPOSE 8768
# The detector loop runs as a background thread inside the API process
# (see main.py). One process, one image, two roles.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8768"]
