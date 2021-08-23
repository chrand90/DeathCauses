CALL conda.bat deactivate && ^
activate C:\Users\Svend\anaconda3\envs\py38 && ^
cd C:\Users\Svend\git\DeathCauses && ^
python recompile.py  --Rpath "C:\Program Files\R\R-4.0.5\bin\Rscript.exe" --nodes %*