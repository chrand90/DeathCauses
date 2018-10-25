
class data_frame:  # svend

    def __init__(self, factornames, credibility):  # factornames should be a list
        self.factornames = factornames
        self.reverse_factornames = {factor:index for index, factor in enumerate(factornames)}
        self.credibility = credibility
        self.listOfRowsInTheDataFrame = []
        
    def addRow(self, row):
        assert len(row) == len(self.factornames) + 1, "Row does not fit data frame."
        self.listOfRowsInTheDataFrame.append(row)
        
    def __len__(self):
        return len(self.listOfRowsInTheDataFrame)
    
    def __mul__(self, other):
        '''
        receives two dataframes with identical factor categories and factor values (in arbitrary order). 
        Returns the one where the value column has been multplied with each other.
        '''
        print self.factornames, other.factornames
        assert set(self.factornames)==set(other.factornames), "the two dataframes are not compatible because of different factor categories."
        factornames=self.factornames #arbritrary that it is not other.factornames - only the order matters here.
        oth=other.getDataframeAsDictionary(factornames)
        sel=self.getDataframeAsDictionary(factornames)
        df=data_frame(factornames, min(other.credibility,self.credibility))
        print sel
        print oth
        for key, val in sel.items():
            assert key in oth, "the two data frames are not compatible because of different factor values"
            df.addRow(list(key)+[val*oth[key]])
        return df
    
    def sum(self):
        return sum([ r[-1] for r in self.listOfRowsInTheDataFrame])
    
    def getRowByIndex(self,index):
        return self.listOfRowsInTheDataFrame[index]
    
    def getDataframeAsDictionary(self, factornames):
        assert set(factornames)==set(self.factornames), "the dictionary requested does not match that of the dataframe"
        res={}
        indices=[ i for _,oth in enumerate(factornames) for i,sel in enumerate(self.factornames) if sel==oth] #this is the order in which to put the columns of self.
        for row in self.listOfRowsInTheDataFrame:
            res[ tuple( row[indices[i]] for i in range(len(row)-1)) ]= row[-1]
        return res
        
    def getDataframeAsList(self):
        res=[row for row in self.listOfRowsInTheDataFrame]
        res.insert(0,self.factornames)
        return res
        
    def __dict__(self):
        self.getDataframeAsList()
        
    def __str__(self):
        '''
        This function returns the string that should be printed when an instance is printed
        '''
        str1 = "Credibility=" + str(self.credibility) + "\n"
        str1 += "\t".join(self.factornames) + "\t" + "Value" + "\n"
        for row in self.listOfRowsInTheDataFrame:
            str1 += "\t".join(map(str, row)) + "\n"
        return str1
        
        
    def subset(self, conditions):
        '''
        Input: dictionary conditions of the form 
        {'factor_name1':['possible_value_1^1',...,'possible_value_r^1'],...,
         'factor_nameM':['possible_value_1^M',...,'possible_value_s^M'] }
        Output: a list of rows where: factor_name1 \in ['possible_value_1^1',...,'possible_value_r^1'], factor_name2 \in ,...,
                                        'factor_nameM' \in ['possible_value_1^M',...,'possible_value_s^M']
        If a factor is not specified as a key, any value will be acceptable for that 
        '''
        
        # reducing the number of conditions while at the same time converting from factor-string to factor number.
        reduced_conditions = {self.reverse_factornames[key]:val for key, val in conditions.items() if key in self.factornames}
                
        ans = []
        for row in self.listOfRowsInTheDataFrame:
            keepRow = True
            for factor_number, set_of_possibles in reduced_conditions.items():
                if row[factor_number] not in set_of_possibles:
                    keepRow = False
            if keepRow:
                ans.append(row)
        return ans
    
    
    
    def summed_subsets(self, list_of_factors):
        '''
        Input: list of the form 
        ['factor_name1',...,'factor_nameM']
                Output: a dictionary of {combination_of_factorCategories_as_tuple:prob_of_that_combination_as_float}
        '''
        
        # converting desired factor name to desired factor index.
        reduced_conditions = [self.reverse_factornames[factor] for factor in list_of_factors if factor in self.factornames]
                
        # print(reduced_conditions)
        ans = {}
        for row in self.listOfRowsInTheDataFrame:
            key = []
            for factor_number in reduced_conditions:
                key.append(row[factor_number])
            ans[tuple(key)] = ans.get(tuple(key), 0) + row[-1]
        
        return ans
    
    def get_categories(self, factors):
        '''
        input factors: list of strings of factornames
        output: dictionary of all values of each of the factors
        '''
        categories = {}
        for f in factors:
            index = self.reverse_factornames[f]
            categorylist = set(row[index] for row in self.listOfRowsInTheDataFrame)
            categories[f] = list(categorylist)
        
        return categories
          
    def get_FactorNames(self):
        return self.factornames
    
    def get_credibility(self):
        return self.credibility
    
    
    def frequency_for_row(self, conditions):
        '''
        Input: dictionary conditions of the form 
        {'factor_name1':'possible_value_1,...,'factor_nameM':'possible_value_M'}
        Output: float, which is the frequency in the dataframe for the given condition
        If a factor in the dataframe is not specified as a key in the conditions, an error will be returned 
        '''
        for key in conditions.keys():
            assert key in self.factornames, 'A factor in the dataframe is not specified'
                
        reduced_conditions = {self.reverse_factornames[key]:val for key, val in conditions.items()}
        
        wanted_row=[]
        for index, value in reduced_conditions.items():
            wanted_row.insert(index,value)         
        
        for row in self.listOfRowsInTheDataFrame:
            if row[:-1]==wanted_row:
                return row[-1]