LOCALLY = 'locally'
REGIONALLY = 'regionally'
GLOBALLY = 'globally'  # DEFAULT
MINBOUNDED = 'min_bounded'  # DEFAULT
BOUNDED_BY_INTERPOLATION_VALUES = 'of_interpolation_values'
BOUNDED_BY_RISKRATIO_VALUES = 'of_riskratio_values'  # DEFAULT
MAXBOUNDED = 'max_bounded'  # NOT DEFAULT
UNBOUNDED = 'unbounded'


class BoundSpecifier:

    def __init__(self, min_bound=None, max_bound=None):
        self.min_bound = min_bound
        self.max_bound = max_bound

    def set_min_bound(self, bound):
        self.min_bound = bound

    def set_max_bound(self, bound):
        self.max_bound = bound

    def computeMin(self, interpolation_element):
        if self.min_bound is None:
            return
        else:
            interpolation_element[2] = self.min_bound

    def computeMax(self, interpolation_element):
        if self.max_bound is None:
            return
        else:
            interpolation_element[3] = self.max_bound


def evaluate_term(termkey, coefficient, insert_dic):
    if len(termkey) == 0:
        return tuple(), coefficient
    if len(termkey) == 2:
        xvar1 = termkey[0]
        if termkey in insert_dic:
            exp1 = termkey[1]
            new_coefficient = coefficient * insert_dic[xvar1] ** exp1
            return tuple(), new_coefficient
        else:
            return termkey, coefficient
    if len(termkey) == 4:
        xvar1, xvar2, exp1, exp2 = termkey
        xvars = []
        exps = []
        new_coefficient = coefficient
        if xvar1 in insert_dic:
            new_coefficient *= insert_dic[xvar1] ** exp1
        else:
            xvars.append(xvar1)
            exps.append(exp1)
        if xvar2 in insert_dic:
            new_coefficient *= insert_dic[xvar2] ** exp2
        else:
            xvars.append(xvar2)
            exps.append(exp2)
        newkey = tuple(xvars + exps)
        return newkey, new_coefficient


def differentiate_term(termkey, coefficient, xvar):
    if len(termkey) == 0:
        return tuple(), 0
    if len(termkey) == 2:
        xvar1 = termkey[0]
        if xvar1 == xvar:
            exp1 = termkey[1]
            new_coefficient=coefficient*exp1
            new_exp=exp1-1
            if new_exp == 0:
                return tuple(), new_coefficient
            else:
                return tuple(xvar,new_exp), new_coefficient
        else:
            return tuple(), 0
    if len(termkey) == 4:
        xvar1, xvar2, exp1, exp2 = termkey
        exps = []
        new_coefficient = coefficient
        if xvar1 == xvar:
            new_coefficient *= exp1
            exps.append(exp1 - 1)
        else:
            exps.append(exp1)
        if xvar2 == xvar:
            new_coefficient *=  exp2
            exps.append(exp2-1)
        else:
            exps.append(exp2)
        if xvar1 != xvar and xvar2 !=xvar:
            return tuple(),0
        else:
            if exps[0]==0:
                return (xvar2,exp2), new_coefficient
            if exps[1]==0:
                return (xvar1,exp1), new_coefficient
            return tuple([xvar1,xvar2]+exps), new_coefficient

def term_to_string(t,c):
    if len(t)==0:
        return str(c)
    if len(t)==2:
        return '{c}*{x}^{e}'.format(c=str(c),x=str(t[0]),e=str(t[1]))
    if len(t)==4:
        return '{c}*{x1}^{e1}*{x2}^{e2}'.format(c=str(c),
                                                x1=str(t[0]),
                                                x2=str(t[1]),
                                                e1=str(t[2]),
                                                e2=str(t[3]))



class Formula:

    def __init__(self, form):
        self.parse_formula(form)

    def __str__(self):
        return '+'.join([term_to_string(t,c) for t,c in self.terms.items()])



    def parse_formula(self, form_as_string):
        added_terms = form_as_string.split('+')
        terms = {}
        xvars = []
        for term in added_terms:
            multiplied_terms = term.split('*')
            coefficient = float(multiplied_terms[0])
            if len(multiplied_terms) > 1:
                xvar1, exp1 = multiplied_terms[1].split('^')
                xvars.append(xvar1)
                if len(multiplied_terms) > 2:
                    xvar2, exp2 = multiplied_terms[2].split('^')
                    xvars.append(xvar2)
                    terms[(xvar1, xvar2, exp1, exp2)] = coefficient
                else:
                    terms[(xvar1, exp1)] = coefficient
            else:
                terms[tuple()] = coefficient
        self.terms = terms
        self.xvars = list(set(xvars))
        self.xvars.sort()

    def insertValues(self, dict_of_inserted_values):
        res_terms = {}
        res_xvars = list(set(self.xvars) - set(dict_of_inserted_values.keys()))
        res_xvars.sort()
        for key, coefficient in self.terms.items():
            res_key, res_coefficient = evaluate_term(key, coefficient, dict_of_inserted_values)
            res_terms[res_key] = res_terms.get(res_key, 0) + res_coefficient
        derived_formula = Formula("")
        derived_formula.xvars = res_xvars
        derived_formula.terms = res_terms
        return derived_formula

    def __call__(self, xvals):
        res = 0
        for key, coefficient in self.terms.items():
            if len(key) == 0:
                res += coefficient
            if len(key) == 2:
                res += coefficient * xvals[key[0]] ** key[1]
            else:
                res += coefficient * xvals[key[0]] ** key[2] * xvals[key[1]] ** key[3]
        return res

    def evaluate_in_dicted_values(self, xvalue_dic):
        return self.__call__([xvalue_dic[x] for x in self.xvars])

    def diffFormula(self, d_xvar):
        res_terms = []
        res_xvars = self.xvars
        for key, coefficient in self.terms.items():
            res_key, res_coefficient = differentiate_term(key, coefficient, d_xvar)
            res_terms[res_key] = res_terms.get(res_key, 0) + res_coefficient
        derived_formula = Formula("")
        derived_formula.xvars = res_xvars
        derived_formula.terms = res_terms
        return derived_formula

    def __add__(self, other):
        res = {}
        for key in self.terms.keys() + other.terms.keys():
            if key not in other.terms:
                res[key] = self.terms[key]
            elif key not in self.terms:
                res[key] = other.terms[key]

    def diff(self):
        pass


def extract_one_dimensional_extremas(formula, lims):
    pass


def extract_extremas(formula, lims):
    if len(lims) == 1:  # the non-hessian way
        return extract_one_dimensional_extremas(formula, lims[0])
    terms = formula.split('+')


def insert_bounds(RR,
                  groupedRR,
                  newdataFrame,
                  level_dics,
                  non_interpolatable_factors,
                  interpolated_factors):
    bounding_method = RR.get_bounding()
    if ',' in bounding_method:
        lstring, ustring = bounding_method.split(',')
        lower_bounding_method, upper_bounding_method = lstring.split(), ustring.split()
    else:
        lower_bounding_method = bounding_method.split()
        upper_bounding_method = [UNBOUNDED]
    bs = BoundSpecifier()
    if MINBOUNDED in lower_bounding_method:
        if REGIONALLY in lower_bounding_method and False:
            pass
        elif LOCALLY in lower_bounding_method and False:
            pass
        else:  # DEFAULTS TO GLOBALLY.
            if BOUNDED_BY_INTERPOLATION_VALUES in lower_bounding_method:
                bs.set_max_bound(extract_extremas(newdataFrame)[0])
            else:  # DEFAULTS TO BOUNDED_BY_RISKRATIO_VALUES
                bs.set_min_bound(RR.getMinAndMax()[0])
    if MAXBOUNDED in upper_bounding_method:
        if REGIONALLY in upper_bounding_method and False:
            pass
        elif LOCALLY in upper_bounding_method and False:
            pass
        else:  # DEFAULTS TO GLOBALLY.
            if BOUNDED_BY_INTERPOLATION_VALUES in upper_bounding_method and False:
                bs.set_max_bound(extract_extremas(newdataFrame)[1])
            else:  # DEFAULTS TO BOUNDED_BY_RISKRATIO_VALUES
                bs.set_max_bound(RR.getMinAndMax()[1])

    RR_datFrame = newdataFrame.getDataframeAsDictionary(non_interpolatable_factors + interpolated_factors)

    for non_interpolated_factor_values, RRpart in groupedRR.items():
        for facts, y in RRpart.get_as_list_of_lists():
            int_levels_for_row = [level_dics[n][fact].asFiniteInterval() for n, fact in enumerate(facts)]
            print("int_levels_for_row", int_levels_for_row)
            factor_level_of_row = list(non_interpolated_factor_values) + list(facts)
            interpolation_element = RR_datFrame[tuple(factor_level_of_row)]
            bs.computeMin(interpolation_element)
            bs.computeMax(interpolation_element)

if __name__=='__main__':
    form="4+5*x0^1+6*x1^1+-0.434*x1^3*x0^1"
    f=Formula(form)
    print(str(f))
    print(f.insertValues({'x0':0}))
