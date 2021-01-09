'''
Created on 17/09/2016

@author: Svend og Christian

this loads and adjusts risk ratio files and returns a writtenF that factor_probabilities.py uses for loading
'''

from data_frame import data_frame
import os
import itertools
from factor_levels import intersect_of_one_coordinate
from collections import defaultdict


class RiskRatioTable(data_frame):

    def __init__(self, factornames, lambd, bounding_method):
        self.lambd = lambd
        self.bounding_method = bounding_method
        super().__init__(factornames, 0)

    def subcopy(self, factornames):
        return RiskRatioTable(factornames, self.lambd, self.bounding_method)

    def get_bounding(self):
        return self.bounding_method

    def get_lambd(self):
        return self.lambd


def loadRRs(writtenF_dir):
    dataframes = []
    (path, listOfFiles) = writtenF_dir, os.listdir(writtenF_dir)

    for fileName in listOfFiles:
        j = 0
        fileLoc = os.path.join(path, fileName)
        lambd = 0.005  # default value for the lambda in spline computations.
        tails = "min_bounded"
        with open(fileLoc) as f:
            for line in f:
                if not line.startswith("#"):
                    if j == 0:
                        splittedLine = line.split()
                        factorName = splittedLine[:-1]
                        df = RiskRatioTable(factorName, lambd, tails)
                        j = j + 1
                    else:
                        splittedLine = line.split()
                        splittedLine[-1] = float(splittedLine[-1])
                        df.addRow(splittedLine)
                elif 'lambda=' in line:
                    lambd = float(line.split('=')[1].strip())
                elif 'tails=' in line:
                    tails = line.split('=')[1].strip()

        dataframes.append(df)

    return dataframes


def read_interaction(writtenF_dir):
    '''
    input: string directory of the position where information on the interaction is(at some point in the future).
    output: a function in the category interaction function, that is a function that takes any number of real numbers and return just one number.
    For now this function is just a dummy function. 
    '''
    return multiplicative, "multiplicative"


def multiplicative(*xs):
    res = 1
    for x in xs:
        res *= x
    return res


def make_simultane_and_get_writtenF(RRs, interaction_function):
    '''
    input:    RRs: list of risk ratio dataframe that in this function will combined to one risk ratio dataframe.
              interaction_function: function that takes any number of real numbers and return just one number.
    output:    res: a dataframe
    
    '''

    lengths = [range(len(df)) for df in RRs]  # (a length of a data frame is the number of rows).
    factorNamesCombined = [df.get_FactorNames() for df in RRs]  # retrieving all factors of the risk ratios.
    reducedFactorNames = remove_duplicates(
        [item for sublist in factorNamesCombined for item in sublist])  # list of all factor names

    indices = list(itertools.product(*lengths))  # this represents all combinations of rows from different data frames.
    res = data_frame(reducedFactorNames, 0)  # the resulting risk ratio dataframe.

    for index in indices:
        uncollapsedRow = []
        riskRatios = []
        for i, df in enumerate(RRs):
            dfRow = df.getRowByIndex(index[i])
            riskRatios.append(dfRow[-1])
            uncollapsedRow.append(dfRow[:-1])

        collapsedRow = thin_out_big_risk_ratio(uncollapsedRow, factorNamesCombined, reducedFactorNames)

        if collapsedRow:  # the collapsedRow is [] if the intersection is empty.
            collapsedRow.append(interaction_function(*riskRatios))
            res.addRow(collapsedRow)

    return res


# Thanks to Paul McGuire from stackoverflow(http://stackoverflow.com/questions/5419204/index-of-duplicates-items-in-a-python-list):
def list_duplicates(seq):
    tally = defaultdict(list)
    for i, item in enumerate(seq):
        tally[item].append(i)
    return {key: locs for key, locs in tally.items()
            if len(locs) > 1}


def remove_duplicates(seq):
    '''
    this funciton removes duplicates from the list seq, preserving order. 
    this function is borrowed from Markus Jarderot on http://stackoverflow.com/questions/480214/how-do-you-remove-duplicates-from-a-list-in-python-whilst-preserving-order
    '''
    seen = set()
    seen_add = seen.add
    return [x for x in seq if not (x in seen or seen_add(x))]


def thin_out_big_risk_ratio(list_of_lists_of_factor_levels,
                            list_of_lists_of_factor_names,
                            list_of_resulting_factor_names,
                            list_of_duplicates=None):
    '''
    input:  list_of_lists_of_factor_levels is a list of the factor levels of the one row from each of riskratio dataframe that are to be combined.
            The factor levels are joined in a list themselves. It will immediately be flattened by the procedure.
            
            list_of_lists_of_factor_names is the list that specifies the factor(name) of each of the factor levels in list_of_lists_of_factor_levels.
            
            list_of_duplicates is a list of the factors that are present more than once in the list_of_lists_of_factor_levels. 
            It is of the form that can be seen in the test at the end of this file, that is ['factor_name':[index_of_ith_repeat_of_the_factor_value]_i, ...]
            
            list_of_resulting_factor_names is a list of the (unique) desired factor_names in an order that will be respected in the output.

    ouput: a list of the factor levels of the corresponding factor names of list_of_resulting_factor_names. If the intersection is empty, this list will also be empty.
    '''
    flat_factor_names = [e for l in list_of_lists_of_factor_names for e in l]
    flat_factor_levels = [e for l in list_of_lists_of_factor_levels for e in l]

    if list_of_duplicates is None:  # this is not necessary to do in every iteration, so this leaves the possiblity to precompute it.
        list_of_duplicates = list_duplicates(flat_factor_names)

    name_to_level = {name: level for name, level in zip(flat_factor_names, flat_factor_levels) if
                     name not in list_of_duplicates}

    # make dictionary: TODO= lav et dictionary til at gaa fra factorname til factor level for dem
    # der ikke er duplicates

    factor_levels = []
    for factor_name in list_of_resulting_factor_names:
        if factor_name in list_of_duplicates:
            to_be_intersected = list_of_duplicates[factor_name]
            intersect, intersect_size = intersect_of_one_coordinate([flat_factor_levels[d] for d in to_be_intersected])
            if intersect_size == 0:
                return []
            factor_levels.append(intersect)
        else:
            factor_levels.append(name_to_level[factor_name])
    return factor_levels


def tester_basic_intersection():
    list_of_lists_of_factor_levels = [["0-1", "tr", "5+", "2"], ["0.5-2", "tr", "4-6", "2"],
                                      ["0+", "tr", "-10", "2"]]
    a = ["A", "B", "C", "D"]
    b = ["E", "B", "C", "D"]
    list_of_lists_of_factor_names = [b, a, a]
    list_of_resulting_factor_names = a + ["E"]
    list_of_duplicates = None
    a = thin_out_big_risk_ratio(list_of_lists_of_factor_levels,
                                list_of_lists_of_factor_names,
                                list_of_resulting_factor_names)

    print(list_of_lists_of_factor_names)
    print(list_of_lists_of_factor_levels)
    print("TEST1:", a == ["0.5-2.0", "tr", "5.0-6.0", "2.0", "0-1"])

    print(a)


if __name__ == "__main__":
    tester_basic_intersection()
