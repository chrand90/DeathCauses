from argparse import ArgumentParser
import os
import sys
import subprocess

def yes_no_continue(instructions, fail_message):
	continue_message="unknown"
	while continue_message.lower() != "y" and continue_message.lower() !="n":
		continue_message= input(instructions)
	if continue_message.lower()=="n":
		print(fail_message)
		sys.exit()
	if continue_message.lower()=="y":
		return "continue"
	assert False, "illegal and misinterpreted answer to the question"
	
def yes_no(instructions):
	continue_message="unknown"
	while continue_message.lower() != "y" and continue_message.lower() !="n":
		continue_message= input(instructions)
	if continue_message.lower()=="n":
		return False
	if continue_message.lower()=="y":
		return True
	assert False, "illegal and misinterpreted answer to the question"


parser = ArgumentParser(description='tool for recompiling DeathCauses')

parser.add_argument('--guided', action='store_true', default=False,
                        help="Will guide you to make sure that the proper setup is used")
parser.add_argument('--Rpath', type=str, default="Rscript",
                        help="the path to the R executable.")

options=parser.parse_args()

if options.guided:
	print("you should be in a python 3 environment with the following packages: ")
	if os.name=="nt":
		subprocess.run(["type", os.path.join("compile","environment.yml")], shell=True)
	else:
		subprocess.run(["cat", os.path.join("compile","environment.yml")], shell=True)
	print("The full list of possibly required software can also be found in compile/environment.yml")
	g=yes_no_continue("Is your python a version with the packages listed above? [y/n]", "aborting... You should install missing packages and rerun script.")
	print("continuing...")

if yes_no("Do you wish to recompute all json files? [y/n]"):
	subprocess.run(["python", "caller.py"], 
				shell=True, 
				cwd="compile")
			
if options.guided:
	print("A list of certainly required R packages can be found in Reportgeneration/DatabaseVisualization/RRtablePlotting/DESCRIPTION and possibly required packages can be found in \"death-causes-app/R markdown explanations/installed_packages.csv\"")
	yes_no_continue("Are you happy with using this command to invoke R notebooks: '"+options.Rpath+"'?[y/n]", "Make sure to add the correct argument to --Rpath for this recompiler")
	
if yes_no("Do you wish to recompute all html help files? [y/n]"):	
	for l in os.listdir(os.path.join("death-causes-app","R markdown explanations")):
		if l.endswith(".Rmd"):
			command= '"rmarkdown::render(\'{filename}\')"'.format(filename=l)
			print("cwd",  os.path.join("death-causes-app", "R markdown explanations"))
			print(command)
			subprocess.run([options.Rpath, "-e", command], shell=True, cwd= os.path.join("death-causes-app", "R markdown explanations"))
		
yes_no_continue("do you want to see the changes on the development server by creating a new server now? [y/n]", "ending script then...")
subprocess.run(["npm", "run", "start-dev"], shell=True, cwd=os.path.join("death-causes-app"))
	
	