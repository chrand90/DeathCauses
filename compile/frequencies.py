import os
from operator import add,truediv
import age_numbers
import data_frame

def getFrequencies(loc):
    print loc
    files=[]
    data=[]
    
    #List of all .txt files in specified directory
    for f in os.listdir(loc):
        if f.endswith(".txt"):
            files=files+[f]
    
    #Extract data from all .txt files to data list of lists
    for f in files:
        fil=open(loc+f,"r")
        tmp=fil.read().split()
        tmp=map(float,tmp)
        data=data+[tmp]
        fil.close()
        
    #Add lists together
    res=data[0]
    for l in data[1:]:
        res=map(add,res,l)   
    
    #Get age intervals and populations
    (ages,pop)=age_numbers.get_age_totals()
    
    #Performs division of data and pop export to dataframe
    row_val=map(truediv,res,pop)
    df=data_frame.data_frame(["Age"],1)
    for age,val in zip(ages,row_val):
        df.addRow([age,val])
    return df

if __name__=="__main__":
    loc="D:\Users\Christian\Dropbox\Eclipse\DeathCauses3\Database\Causes\Alzheimers\ICDfiles"+os.sep
    print getFrequencies(loc)