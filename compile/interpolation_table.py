from spline_formula_analysis import get_interpolation_object


def make_value_dictionary(domains, variable_names):
    return {variable_name: domain for variable_name, domain in zip(variable_names, domains)}


class InterpolationTable(object):

    def __init__(self, truncation='min_bounded globally', interpolation_variables=[], non_interpolation_variables=[]):
        self.truncation_type = truncation
        self.interpolation_variables = interpolation_variables
        self.non_interpolation_variables = non_interpolation_variables
        self.cells = []
        self.lower_truncation = None
        self.upper_truncation = None
        self.global_min = None

    def add_cell(self, interpolation_cell):
        self.cells.append(interpolation_cell)

    def compute_global_min(self):
        if len(self.interpolation_variables) == 0:
            candidates = [
                (cell.value, make_value_dictionary(cell.non_interpolation_domains, self.non_interpolation_variables))
                for cell in self.cells]
        else:
            candidates = []
            for cell in self.cells:
                if cell.min is not None:  # important to check because the infinite interval cells do not have a min.
                    value_dic = {}
                    if len(self.non_interpolation_variables) > 0:
                        value_dic.update(make_value_dictionary(cell.non_interpolation_domains,
                                                               self.non_interpolation_variables))
                    value_dic.update(cell.min['minLocation'])
                    candidates.append((cell.min['minValue'], value_dic))
        candidates.sort(key=lambda tup: tup[0])
        self.global_min = {'minValue': candidates[0][0], 'minLocation': candidates[0][1]}

    def enforce_truncation(self, RR):
        minimum, maximum = RR.getMinAndMax()
        if 'min_bounded' in RR.get_bounding():
            self.lower_truncation=minimum
        if 'max_bounded' in RR.get_bounding():
            self.upper_truncation=maximum

    def enforce_truncation_and_compute_global_min(self,RR):
        self.enforce_truncation(RR)
        self.compute_global_min()

    def enforce_truncation_and_compute_global_min_and_fixed_mins(self,RR):
        self.enforce_truncation(RR)
        self.find_all_mins()
        self.compute_global_min()

    def as_json(self):
        res = {}
        if self.lower_truncation is not None:
            res['lower_truncation'] = self.lower_truncation
        if self.upper_truncation is not None:
            res['upper_truncation'] = self.upper_truncation
        if len(self.interpolation_variables)>0:
            res['interpolation_variables'] = self.interpolation_variables
        if len(self.non_interpolation_variables)>0:
            res['non_interpolation_variables'] = self.non_interpolation_variables
        if self.global_min is not None:
            res['global_min'] = self.global_min
        res['cells'] = [cell.as_json() for cell in self.cells if cell.is_essential()]
        return res


    def find_all_mins(self):
        for cell in self.cells:
            cell.find_mins(self.lower_truncation)


class InterpolationTableCell(object):

    def __init__(self, value=None,
                 interpolation_polynomial=None,
                 interpolation_domains=[],
                 non_interpolation_domains=[]):
        self.value = value
        self.interpolation_polynomial = interpolation_polynomial
        self.interpolation_domains = interpolation_domains
        self.non_interpolation_domains = non_interpolation_domains
        self.min = None
        self.fixed_mins = []
        self.lower_truncation = None
        self.upper_truncation = None

    def is_essential(self):
        """
        Because of continuity property of the splines, there is no extra information on the boundary factorlevels.
        :return: false if there is a non-interval interpolation domain, otherwise true.
        """
        if len(self.interpolation_domains)>0:
            for domain in self.interpolation_domains:
                if ',' not in domain and '+' not in domain:
                    return False
        return True

    def find_mins(self, lower_truncation):
        bounds = []
        all_bounds_set = True
        all_bounds_finite = True
        for domain in self.interpolation_domains:
            if "+" not in domain:
                if ',' in domain:
                    lower, upper = domain.split(",")
                    if lower:
                        bounds.append((float(lower), float(upper)))
                    else:
                        bounds.append((None, float(upper)))
                        all_bounds_finite = False
                else:
                    all_bounds_set = False
                    all_bounds_finite = False
            else:
                lower = domain.split('+')[0]
                bounds.append((float(lower), None))
                all_bounds_finite = False
        if all_bounds_set:
            interpolation_object = get_interpolation_object(self.interpolation_polynomial, bounds, lower_truncation)
            if 'min' in interpolation_object:  # there will not be a min if any of the bounds are infinite
                self.min = interpolation_object['min']
            if 'fixed_mins' in interpolation_object:
                self.fixed_mins = interpolation_object['fixed_mins']

    def as_json(self):
        res = {}
        if self.value is not None:
            res['value'] = self.value
        if self.interpolation_polynomial is not None:
            res['interpolation_polynomial'] = self.interpolation_polynomial
        if len(self.interpolation_domains)>0:
            res['interpolation_domains'] = self.interpolation_domains
        if len(self.non_interpolation_domains)>0:
            res['non_interpolation_domains'] = self.non_interpolation_domains
        if self.min is not None:
            res['min'] = self.min
        if len(self.fixed_mins)>0:
            res['fixed_mins'] = self.fixed_mins
        if self.lower_truncation is not None:
            res['lower_truncation'] = self.lower_truncation
        if self.upper_truncation is not None:
            res['upper_truncation'] = self.upper_truncation
        return res


def interpolation_table_from_riskratio(RR):
    factornames = RR.get_FactorNames()
    bounding_method = RR.get_bounding()
    interpolation_table = InterpolationTable(truncation=bounding_method,
                                             interpolation_variables=[],
                                             non_interpolation_variables=factornames)
    for facts, y in RR.get_as_list_of_lists():
        interpolation_cell = InterpolationTableCell(value=y, non_interpolation_domains=facts)
        interpolation_table.add_cell(interpolation_cell)
    return interpolation_table
