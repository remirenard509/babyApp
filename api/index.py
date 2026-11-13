import sys
import os

# Permet d'importer le module app depuis backend
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

