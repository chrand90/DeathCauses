from scipy.optimize import minimize
from itertools import product
from copy import deepcopy
import math


##Functions that doesnt need to be insid
def evaluate_term(termkey, coefficient, insert_dic):
    if len(termkey) == 0:
        return tuple(), coefficient
    if len(termkey) == 2:
        xvar1 = termkey[0]
        if xvar1 in insert_dic:
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
            new_coefficient = coefficient * exp1
            new_exp = exp1 - 1
            if new_exp == 0:
                return tuple(), new_coefficient
            else:
                return (xvar, new_exp), new_coefficient
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
            new_coefficient *= exp2
            exps.append(exp2 - 1)
        else:
            exps.append(exp2)
        if xvar1 != xvar and xvar2 != xvar:
            return tuple(), 0
        else:
            if exps[0] == 0:
                return (xvar2, exp2), new_coefficient
            if exps[1] == 0:
                return (xvar1, exp1), new_coefficient
            return tuple([xvar1, xvar2] + exps), new_coefficient


def term_to_string(t, c_as_string):
    if len(t) == 0:
        return c_as_string
    if len(t) == 2:
        return '{c}*{x}^{e}'.format(c=c_as_string, x=str(t[0]), e=str(t[1]))
    if len(t) == 4:
        return '{c}*{x1}^{e1}*{x2}^{e2}'.format(c=c_as_string,
                                                x1=str(t[0]),
                                                x2=str(t[1]),
                                                e1=str(t[2]),
                                                e2=str(t[3]))


def get_trivial_formula(coefficient=0.0):
    return Formula(terms={tuple(): coefficient}, bounds=[], xvars=[])


def extract_term_for_fixed(termkey, coefficient, fixed_variables):
    if len(termkey) == 0:
        return tuple(), get_trivial_formula(coefficient)
    if len(termkey) == 2:
        xvar1 = termkey[0]
        if xvar1 in fixed_variables:
            new_termkey = tuple()
            new_coefficient = Formula(terms={termkey: coefficient}, xvars=[xvar1])
            return new_termkey, new_coefficient
        else:
            return termkey, get_trivial_formula(coefficient)

    if len(termkey) == 4:
        xvar1, xvar2, exp1, exp2 = termkey
        if xvar1 in fixed_variables and xvar2 not in fixed_variables:
            new_termkey = (xvar2, exp2)
            new_coefficient = Formula(terms={(xvar1, exp1): coefficient}, xvars=[xvar1])
        elif xvar2 in fixed_variables and xvar1 not in fixed_variables:
            new_termkey = (xvar1, exp1)
            new_coefficient = Formula(terms={(xvar2, exp2): coefficient}, xvars=[xvar2])
        elif xvar1 in fixed_variables and xvar2 in fixed_variables:
            new_termkey = tuple()
            new_coefficient = Formula(terms={termkey: coefficient}, xvars=[xvar1, xvar2])
        else:
            return termkey, get_trivial_formula(coefficient)
        return new_termkey, new_coefficient


class Formula:

    def __init__(self, form="", terms={}, xvars=[], bounds=[]):
        self.bounds = bounds
        if form:
            self.parse_formula(form)
        elif terms:
            self.terms = terms
            if not (len(xvars) == 0 and len(terms) > 1):
                self.xvars = xvars
            else:
                assert False, "xvars is needed to be longer to initialize formula."
        else:
            self.terms = {tuple(): 0.0}
            self.xvars = []
            self.bounds = []

    def __str__(self):
        res = []
        for termkey, coefficient in self.terms.items():
            if isinstance(coefficient, Formula):
                res.append(term_to_string(termkey, "(" + str(coefficient) + ")"))
            else:
                res.append(term_to_string(termkey, str(coefficient)))
        return '+'.join(res)

    def __getitem__(self, entrytuple):
        return self.terms.get(entrytuple, 0)

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
                    terms[(xvar1, xvar2, int(exp1), int(exp2))] = coefficient
                else:
                    terms[(xvar1, int(exp1))] = coefficient
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
        if self.bounds:
            new_bounds = [bounds for n, bounds in enumerate(self.bounds) if self.xvars[n] in res_xvars]
        else:
            new_bounds = []
        derived_formula = Formula(xvars=res_xvars,
                                  terms=res_terms,
                                  bounds=new_bounds)
        return derived_formula

    def get_finite_bounded_vars(self):
        return [xvar for xvar,b in zip(self.xvars, self.bounds) if (b[0] is not None and b[1] is not None)]

    def __mul__(self, other):
        assert not isinstance(other, Formula), "we can't multiply formulas at the moment and it shouldnt be necessary"
        if isinstance(other, int) or isinstance(other, float):
            new_res = {}
            new_xvars = deepcopy(self.xvars)
            for key, coefficient in self.terms.items():
                new_res[key] = coefficient * other
            return Formula(terms=new_res, xvars=new_xvars, bounds=self.bounds)

    def __call__(self, xvals):
        res = 0
        for key, coefficient in self.terms.items():
            if len(key) == 0:
                res += coefficient
            elif len(key) == 2:
                assert key[0] in xvals, key[0] + " was not found in " + str(
                    xvals) + " and it was needed because we wanted to evaluate " + str(self) + " with terms " + str(
                    self.terms)
                res += coefficient * xvals[key[0]] ** key[1]
            else:
                res += coefficient * xvals[key[0]] ** key[2] * xvals[key[1]] ** key[3]
        return res

    def set_bounds(self, bounds):
        assert len(bounds) == len(self.xvars), "tried to add " + str(
            bounds) + " as bounds to a formula with variables " + str(self.xvars)
        self.bounds = bounds

    def packaged_call(self, xval_as_list):
        xvals = {xvar: xval for xvar, xval in zip(self.xvars, xval_as_list)}
        return self.__call__(xvals)

    def evaluate_in_dicted_values(self, xvalue_dic):
        return self.__call__([xvalue_dic[x] for x in self.xvars])

    def diff(self, d_xvar):
        res_terms = {}
        res_xvars = self.xvars
        for key, coefficient in self.terms.items():
            res_key, res_coefficient = differentiate_term(key, coefficient, d_xvar)
            if res_key in res_terms:
                res_terms[res_key] += res_coefficient
            else:
                res_terms[res_key] = res_coefficient
        derived_formula = Formula(xvars=res_xvars, terms=res_terms)
        return derived_formula

    def left_add_number(self, number):
        res_terms = deepcopy(self.terms)
        res_xvars = deepcopy(self.xvars)
        res_terms[tuple()] = res_terms.get(tuple(), 0) + number
        return Formula(terms=res_terms, xvars=res_xvars)

    def __add__(self, other):
        if isinstance(other, float) or isinstance(other, int):
            return self.left_add_number(other)
        assert self.xvars.sort() == other.xvars.sort(), "the variables of the two added together does not match | "
        res_xvars = deepcopy(self.xvars) + deepcopy(other.xvars)
        res_terms = deepcopy(self.terms)
        for key, coefficient in other.terms.items():
            if key in res_terms:
                res_terms[key] += coefficient
            else:
                res_terms[key] = coefficient
        return Formula(terms=res_terms, xvars=res_xvars)

    def __radd__(self, other):
        return self.__add__(other)

    def extract_a_b_c(self):
        assert len(self.xvars) == 1, "we do not find roots of multidimensional polynomials yet"  # the easier case
        xvar = self.xvars[0]
        a = self[(xvar, 2)]
        b = self[(xvar, 1)]
        c = self[tuple()]
        assert self[(xvar, 3)] == 0, "The root of a third degree polynomium was requested and it should never be"
        return a,b,c

    def find_roots(self):
        a, b, c = self.extract_a_b_c()
        if abs(a) < 1e-8:
            if abs(b) < 1e-8:
                return {'critical_points': []}
            return {'critical_points': [[-c / b]]}
        d = b ** 2 - 4 * a * c
        if d < 0:
            return {'critical_points': []}
        return {'critical_points': [[(-b - math.sqrt(d)) / (2 * a)], [(-b + math.sqrt(d)) / (2 * a)]]}

    def find_discriminant(self):
        a, b, c = self.extract_a_b_c()
        return {'discriminant': [[str(a), str(b), str(c)]]}

    def point_within_bounds(self, point):
        assert len(self.bounds) == len(point), "the bounds " + str(
            self.bounds) + " does not have the same length as the point " + str(point)
        for n, (lower, upper) in enumerate(self.bounds):

            if point[n] < lower or point[n] > upper:
                return False
        return True

    def evaluate_candidate_points(self, points):
        candidates = []
        for critical_point in points:
            if self.point_within_bounds(critical_point):
                call_argument = {xvar: xval for xvar, xval in zip(self.xvars, critical_point)}
                y = self.__call__(call_argument)
                candidates.append((y, call_argument))
        return candidates

    def evaluate_first_bounds(self):
        assert len(self.xvars) == 1, "this function cant be called unless there is only one dimension"
        x0 = self.xvars[0]
        first_bound_vals = []
        lower_bound_argument = {x0: self.bounds[0][0]}
        lower_bound_value = self.__call__(lower_bound_argument)
        first_bound_vals.append((lower_bound_value, lower_bound_argument))
        upper_bound_argument = {x0: self.bounds[0][1]}
        upper_bound_value = self.__call__(upper_bound_argument)
        first_bound_vals.append((upper_bound_value, upper_bound_argument))
        return first_bound_vals

    def candidate_points_from_all_one_dimensional_edges(self):
        candidates = []
        for index_of_not_fixed in range(len(self.xvars)):
            fixed_variable = self.xvars[index_of_not_fixed]
            non_fixed_variables = self.xvars[:index_of_not_fixed] + self.xvars[(index_of_not_fixed + 1):]
            bounds_options = [list(b) for i, b in enumerate(self.bounds) if i != index_of_not_fixed]
            for chosen_bounds in product(*bounds_options):
                if all(bound is not None for bound in chosen_bounds):
                    value_dic = {var: bound for var, bound in zip(non_fixed_variables, chosen_bounds)}
                    new_f = self.insertValues(value_dic)
                    min_point = new_f.find_min()
                    value_dic.update(min_point[1])
                    candidates.append((min_point[0], value_dic))
        return candidates

    def discriminant_points_from_all_one_dimensional_edges(self):
        candidates = []
        for index_of_not_fixed in range(len(self.xvars)):
            fixed_variable = self.xvars[index_of_not_fixed]
            non_fixed_variables = self.xvars[:index_of_not_fixed] + self.xvars[(index_of_not_fixed + 1):]
            bounds_options = [list(b) for i, b in enumerate(self.bounds) if i != index_of_not_fixed]
            for chosen_bounds in product(*bounds_options):
                if all(bound is not None for bound in chosen_bounds):
                    value_dic = {var: bound for var, bound in zip(non_fixed_variables, chosen_bounds)}
                    new_f = self.insertValues(value_dic)
                    discriminant = new_f.diff(fixed_variable).find_discriminant()
                    assert 'discriminant' in discriminant, "Somehow the differentiated roots of "+str(new_f)+" did not produce discriminants but instead "+str(discriminant)
                    candidates.append({"values": value_dic, "discriminant": discriminant['discriminant']})

                    # insert not_fixed_variable's boundary values
                    lower, upper = self.bounds[index_of_not_fixed]
                    candidates.append(new_f.get_candidate_object(fixed_variable, lower, value_dic))
                    candidates.append(new_f.get_candidate_object(fixed_variable, upper, value_dic))

        return candidates

    def get_candidate_object(self, variable_free, val, other_values):
        value_dic = deepcopy(other_values)
        value_dic[variable_free] = val
        candidate_lower = self.insertValues({variable_free: val})
        return {"values": value_dic, "candidate": [candidate_lower.terms[tuple()]]}

    def fix(self, variables):
        res_terms = {}
        res_xvars = list(set(self.xvars) - set(variables))
        res_xvars.sort()
        for termkey, coefficient in self.terms.items():
            res_key, res_coefficient = extract_term_for_fixed(termkey, coefficient, variables)
            assert isinstance(res_coefficient, Formula), "the term " + str(
                res_coefficient) + " was not of type formula. It was calculated with key " + str(
                termkey) + " and coefficient " + str(coefficient) + " being fixed for the variables " + str(variables)
            if res_key in res_terms:
                assert isinstance(res_terms[res_key], Formula), "the term " + str(
                    res_terms[res_key]) + " was not of type formula"

                res_terms[res_key] = res_terms[res_key] + res_coefficient
            else:
                res_terms[res_key] = res_coefficient
        new_bounds = [bound for bound, xvar in zip(self.bounds, self.xvars) if xvar in res_xvars]
        derived_formula = Formula(xvars=res_xvars, terms=res_terms, bounds=new_bounds)
        return derived_formula

    def get_mins_for_fixed_edges(self, fixed_variables, free_variables):
        '''

        returns a object describing where the minimums are based on the fixed variables. We will only check one-dimensional edges.
        This means that if x2 and x3 are free variables, we should check all combinations (x2,x3) for where the minimum is as
        a function of the other variables. However, we will only check where the minimums are for
            (x2, x3_lowerbound)
            (x2, x3_upperbound)
            (x2_lowerbound, x3)
            (x2_upperbound, x3)

        This will produce correct results for two-dimensional tables and will still produce somewhat reasonable results
        for higher dimension tables.

        :param fixed_variables: list of variables that should be held fixed
        :param free_variables:
        :return: a dictionary which contains triples from which the discriminant can be computed. They will only depend on the fixed variables.
        '''
        formula_with_fixed = self.fix(fixed_variables)
        return formula_with_fixed.discriminant_points_from_all_one_dimensional_edges()

    def get_mins_for_all_fixed_others(self, fixed_vars=None):
        """
        :param fixed_vars: the variables that will always be fixed in the computations. Useful
        :return: a fixed_mins object
        """
        assert len(self.xvars) > 1, 'There has to be more than one variable to do condition depending on the others'
        iterables = [["Fixed", "Free"] for _ in self.xvars]
        min_objects = []
        for fixed_frees in product(*iterables):

            fixed_variables = [xvar for fstatus, xvar in zip(fixed_frees, self.xvars) if fstatus == 'Fixed']
            free_variables = [xvar for fstatus, xvar in zip(fixed_frees, self.xvars) if fstatus == 'Free']
            if (not (fixed_variables and free_variables)) or set(free_variables).intersection(set(fixed_vars)):
                continue
            min_objects.append({"mins": self.get_mins_for_fixed_edges(fixed_variables, free_variables),
                                "fixed": fixed_variables})
        return min_objects

    def find_min(self):
        if len(self.xvars) == 1:
            x0 = self.xvars[0]
            df = self.diff(x0)
            roots = df.find_roots()
            assert 'critical_points' in roots, "there were not critical points in " + str(roots)
            candidates = self.evaluate_candidate_points(roots['critical_points'])
            candidates.extend(self.evaluate_first_bounds())
            candidates.sort(key=lambda tup: tup[0])
            return candidates[0]

        # checking all edges manually, because there is a high probability that the minimum is here,
        # and the numerical optimizer could have trouble finding it.
        candidates = self.candidate_points_from_all_one_dimensional_edges()

        # numerical optimization
        numerical_optimization_result = self.numerical_solve_for_minimum()
        if numerical_optimization_result['success']:
            xpoint = {xvar: xval for xvar, xval in zip(self.xvars, numerical_optimization_result['x'])}
            candidates.append((numerical_optimization_result['fun'], xpoint))
        candidates.sort(key=lambda tup: tup[0])
        return candidates[0]

    def create_minus_formula(self):
        res_terms={}
        res_bounds=deepcopy(self.bounds)
        res_xvars=deepcopy(self.xvars)
        for termkey, coefficient in self.terms.items():
            assert not isinstance(coefficient, Formula), "cant reverse a function with formula coefficients yet"
            res_terms[termkey]=-coefficient
        new_formula=Formula(xvars=res_xvars, bounds=res_bounds, terms=res_terms)
        return new_formula

    def get_jacobian(self):
        diffs = []
        for xvar in self.xvars:
            diffs.append(self.diff(xvar))

        def jacobian(x):
            return [diff.packaged_call(x) for diff in diffs]

        return jacobian

    def numerical_solve_for_minimum(self):
        return minimize(fun=self.packaged_call, x0=self.midpoint(), method="L-BFGS-B", bounds=self.bounds,
                        jac=self.get_jacobian())

    def midpoint(self):
        res = []
        for lower, upper in self.bounds:
            if lower is not None and upper is not None:
                res.append((lower + upper) / 2)
            elif lower is None and upper is not None:
                res.append(upper)
            elif upper is None and lower is not None:
                res.append(lower)
            else:
                res.append(0)
        return res


def get_interpolation_object(formula, bounds):
    res={}
    f=Formula(formula, bounds=bounds)
    finite_vars=f.get_finite_bounded_vars()
    infinite_vars=list(set(f.xvars)-set(finite_vars))
    if len(finite_vars) == len(bounds):
        min_object=f.find_min()
        res["min"]={"minValue": min_object[0], "minLocation":min_object[1]}

    #If the maximum is ever needed:
    # minus_f=f.create_minus_formula()
    # max_object = minus_f.find_min()
    # res["max"]={"max_value": -max_object[0], "max_location":max_object[1]}

    if len(f.xvars)>1:

        res['fixed_mins']=f.get_mins_for_all_fixed_others(infinite_vars)

    return res


if __name__ == '__main__':
    form = "4+5*x0^1+6*x1^1+-0.434*x1^3*x0^2"
    one_dimensional_form = "0.4*x0^3+5*x0^2+3*x0^1+-40"
    f = Formula(one_dimensional_form, bounds=[(-100, 100)])
    print(str(f))
    print(str(f.diff('x0')))
    # print(f.find_min())

    f2 = Formula(form, bounds=[(-100, 100), (-100, 100)])
    print(str(f2))
    # print(f2.find_min())

    nontrivial = "0+0.3*x0^3+0.3*x0^1*x1^2+0.04*x0^3*x1^3+-4*x0^1+-1*x1^1"
    f = Formula(nontrivial, bounds=[(0, 6), (0, 4)])
    print(str(f))
    print(f.diff('x0'))
    print(f.diff('x1'))
    print("fmin",f.find_min())

    fx1 = f.fix("x0")
    print(f)
    print(fx1)
    print(fx1.diff('x1'))
    print(fx1.insertValues({'x1': 2.0}))
    res_object=f.get_mins_for_all_fixed_others()
    for min_object in res_object:
        print('fixed=', min_object['fixed'])
        for element in min_object['mins']:
            print('\t values=', str(element['values']))
            if 'discriminant' in element:
                for d in element['discriminant']:
                    print('\t\t disk=', str(d))
            if 'candidate' in element:
                for c in element['candidate']:
                    print('\t\t cand=',str(c))
