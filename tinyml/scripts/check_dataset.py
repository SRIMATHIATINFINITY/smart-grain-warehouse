import pandas as pd
from pathlib import Path

base_folder = Path(__file__).resolve().parents[1]

file_path = (
    base_folder
    / "dataset"
    / "raw"
    / "maize"
    / "sweetcorn_experiment_01.csv"
)

print("CSV FILE BEING READ:", file_path)
print("\nFIRST 5 LINES OF CSV:")
print(file_path.read_text(encoding="utf-8").splitlines()[:5])
df = pd.read_csv(file_path)

print("\nDATASET PREVIEW")
print(df.head(13))

print("\nDATASET INFORMATION")
df.info()

print("\nMISSING VALUES")
print(df.isnull().sum())

print("\nBASIC STATISTICS")
print(df.describe())