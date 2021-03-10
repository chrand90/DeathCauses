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
            factor_level_of_row = list(non_interpolated_factor_values) + list(facts)
            interpolation_element = RR_datFrame[tuple(factor_level_of_row)]
            bs.computeMin(interpolation_element)
            bs.computeMax(interpolation_element)


