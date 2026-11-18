import sys

# Prevent Windows Application Control / AppLocker from blocking pyarrow DLL
# Forces pandas to use standard NumPy engine
sys.modules['pyarrow'] = None
