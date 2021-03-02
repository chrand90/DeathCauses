import os
from operator import truediv

from data_frame import data_frame

POPULATION_FILE_PATH=os.path.join(os.pardir, "Database", "Population_sizes"+os.sep+"population.txt")

#Specify directory holding data
#loc=raw_input("Directory of data: ")

def get_age_totals():
    #Load population data and save to pop list as floats
    popfile=open(POPULATION_FILE_PATH,'r')
    age_intervals=popfile.readline().split(" ")
    age_intervals[-1]=age_intervals[-1].strip()
    pop=popfile.readline().split()
    pop=map(float,pop)
    popfile.close()
	
    return age_intervals,pop

def get_age_distribution():
    #Load population data and save to pop list as floats
    popfile=open(POPULATION_FILE_PATH,'r')
    age_cats=popfile.readline().split(" ")
    age_cats[-1]=age_cats[-1].rstrip()
    pop=popfile.readline().split()
    pop=list(map(float,pop))
    popfile.close()
    
    sp=sum(pop)
    df=data_frame(["Age"], 1)
    for age,p in zip(age_cats,pop):
        df.addRow([age, truediv(p,sp)])
        
    return df

if __name__=="__main__":
	print(POPULATION_FILE_PATH)
	#print get_age_distribution()
    #print get_age_totals()
    

