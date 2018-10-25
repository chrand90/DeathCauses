from frequencies import getFrequencies
import factor_probabilities
import os
import time
import risk_ratios as rr
import json

from age_numbers import get_age_distribution, get_age_totals # to adjust the risk ratio to the age intervals

def integrate_all_in_folder(age_intervals, folder):
    '''
    input: age_intervals: list of tuples of intervals with start and end. 
    '''
    
    writtenF_dirs=search_for_writtenF_directories(folder)
    
    age_distribution=get_age_distribution()
    

    
    to_be_jsoned=[]
    for ICD_dir,rr_dirs in writtenF_dirs:
        cause_name=extract_cause_name(ICD_dir)
        rr_norms=[]
        for rr_dir in rr_dirs:
            #print rr_dir
            normalizers, RRs, string_interaction_name=integrate_one(rr_dir,age_intervals, age_distribution)
            rr_norms.append((normalizers,RRs,string_interaction_name))
        frequencies=getFrequencies(ICD_dir+os.sep)#, total_population)
        to_be_jsoned.append((cause_name, frequencies, rr_norms))
    return to_be_jsoned
            
def extract_cause_name(ICD_dir):
    return ICD_dir.split(os.sep)[-2]


def run(age_intervals=None):
    if age_intervals is None:
        age_intervals= get_age_totals()[0]
    transform_to_json(integrate_all_in_folder(age_intervals, "Causes"), "Causes_for_json")
    #transform_to_json(integrate_all_in_folder(age_intervals, "Indirect_Causes"), "Indirect_causes_for_json")


def transform_to_json(inp, filename):
    print inp
    with open(filename, 'w') as f:
        f.write(json.dumps(inp, default=lambda df: df.getDataframeAsList()))

        
def integrate_one(writtenF_dir, age_intervals,age_distribution):
    '''
        input: writtenF_dir: a string directory to the folder of risk ratio files. 
               age_intervals: a list of list/tuples of numbers that give the age intervals to integrate separately.
        output: a list of normalizing constants. 
    '''
    RRs=rr.loadRRs(writtenF_dir)
    interaction, string_interaction_name=rr.read_interaction(writtenF_dir)
    RR= rr.make_simultane_and_get_writtenF(RRs, interaction)
    RRages=[factor_probabilities.adjust_to_age_group(RR, age_interval, age_distribution) for age_interval in age_intervals]
    
    factor_prob_data_frames=factor_probabilities.get_factor_probabilities(RR.get_categories(RR.get_FactorNames()), age_intervals)
    
    normalizers=[]
    
    for RRage, factor_prob_data_frame in zip(RRages, factor_prob_data_frames):
        #print factor_prob_data_frame
        #print  RRage
        combined_df=factor_prob_data_frame*RRage
        normalizers.append(combined_df.sum())
    
    #RRs_as_dictionaries=[RR.getDataframeAsDictionary(RR.factornames) for RR in RRs]
    
    return normalizers, RRs, string_interaction_name

def create_normalizer_file(writtenF_dir, nums):
    '''
    input: writtenF_dir: string directory of the position of the riskratio files for which nums are the normalizers. 
    '''
    with open(writtenF_dir+"normalizer.txt", 'w') as f:
        for num in nums:
            f.write(str(num)+"\t")
    
        

    
    


def getAllCategories(listOfDataframes):
    '''
    Input: list of dataframes [df1,df2,...]
    Output: Dictionary {factor1:[factor categories for factor1], ...}
    Note that all dataframes are adjusted to RR categories before this function is called,
    thus it doesn't matter which dataframe is used to get the categories for a given factor. 
    '''
    factorDic = {}
    for df in listOfDataframes:
        factorDic.update(df.get_categories(df.get_FactorNames())) 
    return factorDic

# def similarize_rrs(rrs):
#     return rrs
    


def search_for_writtenF_directories(folder):
    writtenF_dirs=[]
    list_of_files=os.walk(os.path.join(os.pardir, "Database", folder))
    for path,dirs_within,_ in list_of_files: 
        if "ICDfiles" in dirs_within:
            rr_dirs=[path+os.sep+direc for direc in dirs_within if direc!="ICDfiles"]
            writtenF_dirs.append((path+os.sep+"ICDfiles",rr_dirs))
    return writtenF_dirs

   

if __name__ == "__main__":
    start=time.time()
    alist = search_for_writtenF_directories("Causes")
    #print alist
    run()
#     res=[]
#     for a in alist[:2]:    
#         for df in loadRRs(a):
#             print df
#             res.append(df)
#     ai=[]
#     for i in range(0,100,10):
#         ai.append((i,i+10))
#     integrate_all(ai)
         
 
     
    #make_simultane_and_get_writtenF(res,multiplicative(1,2))
    end=time.time()
    print end-start