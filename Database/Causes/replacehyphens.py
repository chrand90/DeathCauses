import os
import re
from os import listdir
from os.path import isfile, join
import glob
dir_path = os.path.dirname(os.path.realpath(__file__))
onlyfiles = glob.glob('**/*.txt', recursive=True)
for filename in onlyfiles:
	if not "ICD" in filename:
		print(filename)
		f = open(filename, 'r+')
		text = f.read()
		text = re.sub('-', ',', text)
		f.seek(0)
		f.write(text)
		f.truncate()
		f.close()

#f = open(filename, 'r+')
#text = f.read()
#text = re.sub('foobar', 'bar', text)
#f.seek(0)
#f.write(text)
#f.truncate()
#f.close()
