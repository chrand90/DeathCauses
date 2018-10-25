# DeathCauses

The goal of this project is to develop a method for estimating life expectancy based on key risk factors, e.g. BMI, drinking. The idea and math/statistics is developed in /resources/notation and integration.pdf. The python code in the directory /compile/ prepares and compiles the data as described in the .pdf. The data is ouput to the "causes_for_json" file. The intent is to develop javascript enabling the estimation of life expectancy based on the prepared data.

Note: this project is not finished yet, as the javascript part has not been developed yet.

### Author
The idea and theory has been developed primarily by Svend V. Nielsen. The Python code has been developed by Svend V. Nielsen and Christian Andersen in collaboration.

### Prerequisites
The python code in /compile/ is written for Python 2.7. The program uses standard python packages only.

### Installation and running the code
In order to run the code, simply download the deathcauses folder, and run "caller.py" in /compile/. This outputs the "causes_for_json" in the /compile/ directory.
