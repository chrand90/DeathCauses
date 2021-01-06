'''
Created on 17/09/2016

@author: Svend og Christian

this file contains functions to analyse and manipulate factor levels.
'''

NUMERICAL_FACTOR_TYPES=['y+','x-y','-x','x']


def getIntersectionAndSize(list1, list2):
    if list1[1] == list2[1] == float('Inf'):
        return 1, str(min(list1[0],list2[0]))+"+"
    lower=max(list1[0], list2[0])
    upper=min(list2[1], list1[1])
    return max(0, upper-lower ), str(lower)+"-"+str(upper)
    
def isInInterval(point, interval, type_interval):
    if type_interval == 'x':
        if (abs(interval[0] - point) < 1e-8):
            return 1,str(point)
        else:
            return 0,None
    open_in_bottom = (type_interval != '-x')
    if point <= interval[1] + 1e-8:
        if point >= interval[0] - 1e-8:
            if abs(point - interval[0]) < 1e-8:
                if open_in_bottom:
                    return 0, None
                return 1, str(point)
            return 1, str(point)
    return 0, None
   
    
def intersect_of_one_coordinate(*factor):
    '''
    same task as intersect_size_of_one_coordinate just with intersection of n coordinates instead of 2.
    '''
    factors=list(*factor) #making a list of all the factors.
    size,fact=intersect_and_size_of_one_coordinate(factors[0],factors[1])
    for i in range(2,len(factors)):
        #print fact
        if fact is None:
            break
        size,fact= intersect_and_size_of_one_coordinate(fact, factors[i])
    return fact, size
    
    

def intersect_and_size_of_one_coordinate(factor1, factor2):
    type_1, values_1 = factor_type(factor1)
    type_2, values_2 = factor_type(factor2)
    
    # checking if both or one of them is a string
    if type_1 == 'str' == type_2:
        return (values_1 == values_2) * 1, values_1[0]
    if type_1 == 'str' or type_2 == 'str':
        return 0, None
    
    # checking if one of them is a point
    if type_1 == "x":
        return isInInterval(values_1[0], values_2, type_2)#, str(values_1[0])
    if type_2 == 'x':
        return isInInterval(values_2[0], values_1, type_1)#, str(values_1[0])  #
    
    # if this point is reached, both are intervals
    return getIntersectionAndSize(values_1, values_2)

def intersect_size(f1, f2):
    '''
    input: f1 factor category
    input: f2 factor category
    output: float describing the size of intersection
    '''
    ans = 1
    for factor1, factor2 in zip(f1, f2):
        ans *= intersect_and_size_of_one_coordinate(factor1, factor2)[0]
    return ans
      
    
    
def category_size(f1):  # svend
    '''
    input: f1 factor category
    output: float describing the size of intersection
    '''
    ans = 1
    for factor in f1:
        if "-" in factor:
            numbers = factor.split("-")
            if not numbers[0]:  # if numbers[0] is empty, it means that the factor category is of the form "-x", where x is a number
                ans *= float(numbers[1])
            else:
                ans *= float(numbers[1]) - float(numbers[0])
    return ans

class factor_level(object):
    
    def __init__(self, string):
        self.string=string
        self.type,self.value= factor_type(string)
        self.setBoundsAndMidpoints()
        
    def getSize(self):
        if self.type=='x':
            return 1
        else:
            return self.upperBound-self.lowerBound
        
    def setBoundsAndMidpoints(self):
        if self.type=='x-y':
            self.lowerBound= self.value[0]
            self.upperBound= self.value[1]
            self.midPoint=self.value[1]/2+self.value[0]/2
            self.length=self.value[1]-self.value[0]
        elif self.type=='y+':
            self.lowerBound= self.value[0]
            self.upperBound= None
            self.midPoint= None
            self.length=None
        elif self.type=='x':
            self.lowerBound = self.upperBound = self.midPoint = self.value[0]
            self.length=None
        elif self.type=='-x':
            self.lowerBound=None
            self.upperBound=self.value[1]
            self.midPoint=None
            self.length=None
        else:
            self.lowerBound=None
            self.upperBound=None
            self.midPoint=None
            self.length=None

    def asFiniteInterval(self):
        if self.type=='x':
            return [self.midPoint]
        else:
            return [self.lowerBound, self.upperBound]
    
    def getInterval(self, after_midpoint=False):
        if after_midpoint:
            return (self.midPoint, self.upperBound)
        else:
            return (self.lowerBound, self.midPoint)
        
    def isNumeric(self):
        return self.type in NUMERICAL_FACTOR_TYPES
    
    def isFinitePositiveInterval(self):
        return self.type=='x-y'
    
    def getType(self):
        return self.type
    
    
    def hasUpperBound(self):
        return self.upperBound is not None
    
    def hasLowerBound(self):
        return self.lowerBound is not None
    
    def setLowerBound(self, new_val):
        self.lowerBound=new_val
        
    def setUpperBound(self, new_val):
        self.upperBound=new_val
        
    def setMidPoint(self, new_val):
        self.midPoint=new_val
    
    def getLowerBound(self):
        assert self.hasLowerBound(),'requested lower bound which can not be computed'
        return self.value[0]
    
    def getUpperBound(self):
        assert self.hasUpperBound(),'requested lower bound which can not be computed'
        return self.value[0]
        
    
    def average(self):
        if self.type=='-x':
            return -float('Inf')
        if self.type=='x':
            return self.value[0]
        if self.type=='x-y':
            return self.value[1]/2+self.value[0]/2
        if self.type=='y+':
            return float('Inf')
        assert False, 'average requested from non numeric factor level'
        
    def __str__(self):
        return str({"value":self.value, "type":self.type, "key":self.string, "upperBound":self.upperBound,
                    "lowerBound":self.lowerBound, "midPoint":self.midPoint, "length": self.length})

def interval_length(output_from_factor_type):
    assert output_from_factor_type[0]!='str', 'passed a string factor to interval_length'
    typ=output_from_factor_type[0]
    print('typ', typ)
    if typ=='x':
        return 0
    if typ=='-x' or typ=='y+':
        return float('Inf')
    if typ=='x-y':
        return output_from_factor_type[1][1]-output_from_factor_type[1][0]
            
            
def factor_type(factor):
    if '+' in factor:
        return 'y+', (float(factor.split("+")[0]), float('Inf'))
    elif ',' in factor:
        numbers = factor.split(',')
        if not numbers[0]:
            return '-x', (-float('Inf'), float(numbers[1]))
        else:
            return 'x-y', (float(numbers[0]), float(numbers[1]))
    else:
        try: 
            float(factor)
            return 'x', (float(factor),)
        except ValueError:
            return 'str', (factor,)
    
