# generate Rmd files
import json
import os
import math

OPTIM10="It is impossible to change and it has never been in your control"
OPTIM20="It is impossible to change, but it could have been the consequence of your actions"
OPTIM30="It is impossible to change now, but it has once definitely been in your control"
OPTIM80="It is possible to change, but it will take a lot of time."
OPTIM90="It is possible to change, and it can be changed now or very soon."

OPTIM_DIC={10:1, 20:2, 30:3, 80:4, 90:5}
OPTIM_REVERSE_DIC={v:k for k,v in OPTIM_DIC.items()}
OPTIM_DESCRIPTION_DIC={1:OPTIM10, 2:OPTIM20, 3:OPTIM30, 4:OPTIM80, 5:OPTIM90, 10:OPTIM10, 20:OPTIM20, 30:OPTIM30, 80:OPTIM80, 90:OPTIM90}

with open("../src/resources/Causes.json", "r") as f:
    causes = json.loads(f.read())
with open("../src/resources/Conditions.json", "r") as f:
    conditions = json.loads(f.read())
with open("../src/resources/Factordatabase.json", "r") as f:
    factors = json.loads(f.read())
with open("../src/resources/CategoryCauses.json", "r") as f:
    category_causes = json.loads(f.read())
with open("../src/resources/Relations.json", "r") as f:
    relations = json.loads(f.read())
with open("../src/resources/Descriptions.json", "r") as f:
    descriptions = json.loads(f.read())
with open("../src/resources/ICD.json", "r") as f:
    ICDs = json.loads(f.read())
with open("../src/resources/totalDeaths.json", "r") as f:
    totals = json.loads(f.read())
with open("../../Database/ICD dictionary/icd_dictionary.json") as f:
    ICD_definitions = json.loads(f.read())
start_walk_loc = os.path.join( "texts")
list_of_files = os.walk(start_walk_loc)
texts={}
text_counter=0
for path, dirs_within, files_within in list_of_files:
    if len(files_within) > 0 and len(dirs_within) == 0:
        path_parts = path.split(os.sep)
        node_name = path_parts[-1]
        texts[node_name] = {}
        for fil in files_within:
            fil_parts = fil.split("-")
            element = "-".join(fil_parts[:-1])
            if not element in texts[node_name]:
                texts[node_name][element]={}
            location = fil_parts[-1].split(".")[0]
            with open(os.path.join(path,fil), 'r') as f:
                content=f.read()
            texts[node_name][element][location]=content


BEGINNING_OF_RCODE="```{r echo=FALSE, message=FALSE, warning=FALSE, paged.print=FALSE}\n"
END_OF_RCODE="```\n\n"


def get_all_descriptions(name):
    all_descriptions_of_node = descriptions[name]["descriptions"]
    all_descriptions_of_node.sort(key=len)
    if name in all_descriptions_of_node:
        return all_descriptions_of_node
    else:
        return all_descriptions_of_node + [name]

def get_optimizability(node_name):
    return descriptions[node_name]["optimizability"]

def get_factors_of_certain_optimizability(optim):
    res=[]
    for node_name,descrip_node in descriptions.items():
        if "optimizability" in descrip_node:
            if descrip_node["optimizability"]==optim:
                res.append(node_name)
    return res


def get_text(node_name, element, beforeafter="before"):
    if node_name in texts:
        if element in texts[node_name]:
            if beforeafter in texts[node_name][element]:
                return texts[node_name][element][beforeafter]
    return None

def add_text_if_there(f, node_name, element, beforeafter="before"):
    text_available=get_text(node_name, element, beforeafter)
    if text_available:
        f.write(text_available)


def get_immediate_ancestors_of_certain_type(node_name, requested_types):
    res = []
    for ancestor in relations[node_name]["ancestors"]:
        if relations[ancestor]["type"] in requested_types:
            res.append(ancestor)
    return res

def get_input_nodes(node_name):
    return relations[node_name]["ancestors"]


def get_ICD_description(ICD_code):
    if ICD_code in ICD_definitions:
        return ICD_definitions[ICD_code]
    else:
        return ""

def get_death_cause_children(node_name):
    res=[]
    for key, node in relations.items():
        if node_name in node["ancestors"]:
            res.append([key, node["type"]=="Death cause category"])
    return res

def get_children(node_name):
    res=[]
    for key, node in relations.items():
        if node_name in node["ancestors"]:
            res.append((key, node["type"]))
    return res

def get_input_factor(node_name):
    for f in factors:
        if f["factorname"]==node_name:
            return f


def get_description(name, maxlength=20):
    if name in descriptions:
        candidates = [f for f in descriptions[name]["descriptions"] if len(f) <= maxlength]
        if len(candidates) == 0:
            return name
        else:
            candidates.sort(key=len)
            return candidates[-1]

    else:
        return name

def make_opener(title, f):
    f.write('---\n')
    f.write('title: "' + title + '"\n')
    f.write('output:\n\
    html_document:\n\
        theme: null\n\
        template: null\n\
        self_contained: false\n\
        pandoc_args: ["--no-highlight"]\n\
bibliography: references.bib\n\
link-citations: true\n\
---\n\
\n\
\n\
<style type="text/css">\n\
\n\
body{\n\
    background:#F0F0F0;}\n\
blockquote{\n\
  text-align: center;}\n\
\n\
</style>\n')
    f.write("_[auto-generated file]_\n\n")

def createRMD(node_name):
    title = get_description(node_name, 40)
    with open(os.path.join("resources",node_name + "_auto.Rmd"), "w") as f:
        make_opener(title, f)    
        if relations[node_name]["type"] == "Death cause":
            fill_out_death_cause(node_name, title, f)
        if relations[node_name]["type"] == "Death cause category":
            fill_out_death_cause_category(node_name, title, f)
        if relations[node_name]["type"] == "Condition":
            fill_out_condition(node_name, title, f)
        if relations[node_name]["type"] == "Computed factor":
            fill_out_compted_factor(node_name, title, f)
        if relations[node_name]["type"] == "Input factor":
            fill_out_input_factor(node_name, title, f)
        f.write("\n\n## References")

def alternative_names(node_name, f):
    all_names = get_all_descriptions(node_name)
    if len(all_names) > 1:
        f.write("\n#### Alternative names:\n")
        for nam in all_names:
            f.write("* " + nam + "\n")

def get_ordered_keys(icd_object):
    raw_order=list(icd_object.keys())
    raw_order.sort(key= lambda x: float(icd_object[x][1]))
    res_order=[]
    strongs=[]
    while raw_order:
        next_plane=[]
        candidate=raw_order[-1]
        target_val=icd_object[candidate][1]
        strongs.append(candidate)
        #next_plane.append(candidate)
        parent=candidate[:-1]
        strongs_extras=[]
        if len(parent)==0:
            raw_order.remove(candidate)
            next_plane.append(candidate)
        while len(parent)>0:
            part_plane=[]
            for r in raw_order:
                if r.startswith(parent):
                    part_plane.append(r)
                    if target_val*0.3<icd_object[r][1]:
                        strongs_extras.append(r)
            for r in part_plane:
                raw_order.remove(r)
            part_plane.sort()
            next_plane.extend(part_plane)
            parent=parent[:-1]
        if len(next_plane)>6:
            strongs.extend(strongs_extras)
        res_order.append(next_plane)
    return res_order, strongs


def write_icd_group(icd_object, f, spaces=0):
    if spaces>0:
        indent=' '*spaces
    else:
        indent=""
    keys, strongs = get_ordered_keys(icd_object)
    for n,ICDgroup in enumerate(keys):
        for ICD in ICDgroup:
            node=icd_object[ICD]
            proportion=float(node[1])*100
            if proportion>=50:
                if proportion>99.9999:
                    rounded_proportion="100.0"
                elif proportion<=90:
                    rounded_proportion = f"{proportion:.3g}"
                else:
                    digits=math.ceil(-math.log10(100-proportion))+3
                    rounded_proportion = f"{proportion:.{digits}g}"
            else:
                if proportion>=10:
                    rounded_proportion = f"{proportion:.3g}"
                else: 
                    rounded_proportion = f"{proportion:.2g}"                  
            f.write(indent+"* ")
            if node[2]=="Parent" and spaces==0 :
                f.write("<details><summary> ")
            if ICD in strongs and len(ICDgroup)>4 and proportion>1:
                f.write("**")
            f.write(ICD)
            ICD_description = get_ICD_description(ICD)
            if len(ICD_description)>1:
                f.write(": "+ICD_description)
            f.write(" ("+rounded_proportion+"%)")
            if ICD in strongs and len(ICDgroup)>4 and proportion>1:
                f.write("**")
            if node[2] == "Parent":
                if spaces == 0:
                    f.write("</summary>\n")
                else:
                    f.write("\n")
                write_icd_group(node[3], f, spaces+4)
                if spaces == 0:
                    f.write(indent+"</details>\n")
            else:
                f.write("\n")
        if spaces==0 and n< len(keys)-1:
            f.write("  \n---- \n\n")

def make_icd_definition(node_name, title, f):
    f.write("\n#### Definition\n\n")
    text_available=get_text(node_name, "definition", "before")
    if text_available:
        f.write(text_available)
    else:
        f.write("The definition of dying from " + title + " is to get")
        f.write(" any of the following ICD codes as the main cause of death on one's death certificate. ")
        f.write("The percentage is the proportion of the deaths from "+title+" who falls under the ICD code \n\n")
    icd_object=ICDs[node_name]
    write_icd_group(icd_object, f)
    f.write("\n Source: @CDCreport, @ICDcodes\n\n")
    add_text_if_there(f, node_name, "definition", "after")


def get_all_risk_factor_groups(node_name):
    if node_name in causes:
        rfgs = [(node_name, rfg) for rfg in causes[node_name]["RiskFactorGroups"]]
    elif node_name in category_causes:
        rfgs = [(node_name, rfg) for rfg in category_causes[node_name]["RiskFactorGroups"]]
    elif node_name in conditions:
        rfgs = [(node_name, rfg) for rfg in conditions[node_name]["RiskFactorGroups"]]
    else:
        return []
    for ancestor in relations[node_name]["ancestors"]:
        if relations[ancestor]["type"]=="Death cause category":
            rfgs += get_all_risk_factor_groups(ancestor)
    return rfgs

def get_all_special_factor_groups(node_name):
    return conditions[node_name]["SpecialFactorGroups"]

def get_all_nodes_of_riskfactorgroup(rfg):
    res = []
    for rrt in rfg["riskRatioTables"]:
        res += rrt["riskFactorNames"]
    return list(set(res))


def get_risk_ratio_separated_factors(rfgs):
    res = []
    for node, rfg in rfgs:
        for rrt in rfg["riskRatioTables"]:
            res.append(rrt["riskFactorNames"])
    return res


def make_list_of_deathcause_categories(node_name, title, f, add_itself=False):
    ancestors = get_immediate_ancestors_of_certain_type(node_name, ["Death cause category"])
    itself_string = "itself " if add_itself else ""
    if ancestors:
        f.write("\n#### Categories\n\n")
        f.write(title + " is " + itself_string + "part of the following death cause categories\n\n")
        for ancestor in ancestors:
            f.write("* [" + get_description(ancestor, 40) + "](/model/" + ancestor + ")\n")

def make_number_of_deaths_section(title, node_name, f, condition=False):
    if condition:
        f.write("\n#### Prevalence\n\n")
    else:
        f.write("\n#### Number of deaths\n\n")
        proportion = totals[node_name]["proportion"] * 100
        rounded_proportion = '%s' % float('%.3g' % proportion)
        f.write("In 2014 " + title + " was responsible for "+rounded_proportion+ "% of the deaths in the US. ")
        f.write("Below is a plot of how prevalent the death was for different ages [@CDCreport]\n")
    load_R(f, use_conditions=condition)
    f.write(BEGINNING_OF_RCODE)
    f.write("plotSpecificPlots(dat, '" + node_name + "')\n")
    f.write(END_OF_RCODE)
    add_text_if_there(f, node_name, "number_of_deaths", "after")

def load_R(f, use_conditions=False, use_cause_categories=False):
    f.write(BEGINNING_OF_RCODE)
    f.write("library(devtools)\n")
    f.write("devtools::load_all('../../../Reportgeneration/DatabaseVisualization/RRtablePlotting')\n")
    f.write('dat=initialize_database(c("../../../death-causes-app/src/resources/Causes.json"')
    if use_conditions:
        f.write(',\n"../../../death-causes-app/src/resources/Conditions.json"')
    if use_cause_categories:
        f.write(',\n"../../../death-causes-app/src/resources/CategoryCauses.json"')
    f.write("),\n")
    f.write('"../../../death-causes-app/src/resources/Descriptions.json")\n')
    f.write(END_OF_RCODE)


def make_section_for_rfg(title, rfg, node_name, f):
    for rrt in rfg["riskRatioTables"]:
        make_section_for_rrt(title, rrt, node_name, f)

def make_reference_to_rfg_section(title, rfg, location_node, f):
    for rrt in rfg["riskRatioTables"]:
        make_reference_section_for_rrt(title, rrt, location_node, f)

def make_reference_section_for_rrt(title,rrt,location_node,f):
    factornames, factornames_raw, header, factorstring = make_header_of_rrt_section(rrt, f)
    ref=header.replace(" ","-").lower()
    f.write("See ")
    f.write("["+get_description(location_node,30)+": "+header+"](/model/"+location_node+"#"+ ref +")\n\n")

def make_header_of_rrt_section(rrt, f):
    factornames_raw = rrt["riskFactorNames"]
    factornames=[get_description(factor_name,30) for factor_name in factornames_raw]
    factornames.sort()
    header = ", ".join(factornames)
    f.write("\n#### " + header + "\n\n")
    factorstring=header
    if len(factornames) > 1:
        factorstring = ', '.join(factornames[:-1]) + " and " + factornames[-1]
    return factornames, factornames_raw, header, factorstring

def make_section_for_rrt(title, rrt, node_name, f):
    factornames, factornames_raw, header, factorstring= make_header_of_rrt_section(rrt,f)
    list_for_r_code=["'"+factorname+"'" for factorname in factornames_raw]
    factorstring_raw="-".join(sorted(factornames_raw))
    text_available= get_text(node_name,"rrt-"+factorstring_raw)
    if text_available:
        f.write(text_available)
    else:
        if len(factornames) > 1:
            multivariate = True
            f.write(factorstring + " are a group of risk factors for " + title + ".\n\n")
        else:
            multivariate = False
            f.write(factorstring + " is a risk factor for " + title + ".\n\n")
        f.write("Below is a plot of the risk ratios we have " +
                "taken from the literature alterated to fit our model\n\n")
    f.write(BEGINNING_OF_RCODE)
    f.write("plotSpecificPlots(dat, '"+node_name+"', c(" + ','.join(list_for_r_code) + "),'raw')\n")
    f.write(END_OF_RCODE)
    add_text_if_there(f, node_name,"rrt-"+factorstring_raw, "after")
    if "interpolation_variables" in rrt["interpolationTable"]:
        interpolation_variables_raw=rrt["interpolationTable"]["interpolation_variables"]
        interpolation_variables = [get_description(factor_name, 30) for factor_name in interpolation_variables_raw]
        text_available=get_text(node_name, "interpolation-"+factorstring_raw)
        if text_available:
            f.write(text_available)
        else:
            f.write("\nBecause the variable")
            if len(interpolation_variables)>1:
                interpolationstring = ', '.join(interpolation_variables[:-1]) + " and " + interpolation_variables[-1]
                f.write("s "+ interpolationstring + " are numeric, ")
            else:
                f.write(" "+interpolation_variables[0]+ " is numeric, ")
            f.write("we have computed a [smoothed approximation](/model/intro#smoothing)")
            if len(interpolation_variables)!=len(factornames):
                f.write("for every value of the other variables")
            f.write(".\n")
        f.write(BEGINNING_OF_RCODE)
        f.write("plotSpecificPlots(dat, '" + node_name + "', c(" + ','.join(list_for_r_code) + "),'interpolated')\n")
        f.write(END_OF_RCODE)
        add_text_if_there(f, node_name,"interpolation-"+factorstring_raw, "after")

def make_list_of_death_cause_children(node_name, title,f):
    f.write("\n#### Death causes\n\n")
    f.write(title+" consists of the following causes\n\n")
    for child, is_category in get_death_cause_children(node_name):
        if is_category:
            f.write("* The death causes of the category *["+get_description(child, 25)+"](/model/"+child+")")
        else:
            f.write("* ["+get_description(child, 30)+"](/model/"+child+")\n")

def make_list_of_descendants(node_name, title, f):
    f.write("\n#### Uses\n\n")
    f.write(title + " is used by the model in the following places\n\n")
    for child, category in get_children(node_name):
        if category=="Death cause category":
            f.write("* The death causes of the category *["+get_description(child, 25)+"](/model/"+child+")")
        else:
            f.write("* ["+get_description(child, 30)+"](/model/"+child+")\n")

def make_list_of_special_factors(node_name, title, spfgs, f):
    ancestors = []
    for spfg in spfgs:
        for spfg_table in spfg:
            for special_factor in spfg_table["riskFactorNames"]:
                ancestors.append( special_factor)
    if ancestors:
        f.write("\n#### Special factors\n\n")
        f.write("In the model " + title + " has the following [special factors](/model/intro#special-factor)\n\n")
        for  ancestor in ancestors:
            long_name = get_description(ancestor, 30)
            f.write("* [" + long_name + "](/model/" + ancestor + ")")
            short_name = get_description(ancestor, 12)
            if short_name != long_name:
                f.write(" (" + short_name + ")")
            f.write("\n")

def make_list_of_input_factors(node_name, title, f):
    ancestors= get_input_nodes(node_name)
    f.write("\n#### Input\n\n")
    f.write(title + " is computed with the following factors\n\n")
    for ancestor in ancestors:
        f.write("* [" + get_description(ancestor, 30) + "](/model/" + ancestor + ")\n")


def make_list_of_risk_factors(node_name, title, rfgs, f):
    ancestors = []
    for rfg_node, rfg in rfgs:
        for risk_factor in get_all_nodes_of_riskfactorgroup(rfg):
            ancestors.append((rfg_node, risk_factor))
    f.write("\n#### Risk factors\n\n")
    if ancestors:
        f.write("In the model " + title + " has the following [risk factors](/model/intro#risk-factor)\n\n")
        for location_node, ancestor in ancestors:
            long_name = get_description(ancestor, 30)
            f.write("* [" + long_name + "](/model/" + ancestor + ")")
            short_name = get_description(ancestor, 12)
            if short_name != long_name:
                f.write(" ("+short_name + ")")
            if location_node != node_name:
                f.write(" inherited from [" + get_description(location_node, 22) + "](/model/" + location_node + ")")
            f.write("\n")
        return True
    else:
        f.write(title + " has no [risk factors](/model/intro#risk-factor) in the model (yet).\n")
        return False

def make_computation_section(node_name, title, f):
    f.write("\n#### Computation\n\n")
    text_available= get_text(node_name,"computation")
    if text_available:
        f.write(text_available)
    else:
        f.write("[Place explanation for how "+ title +" is computed here]\n\n")

def make_units_table(factor_node, f):
    for unit_name, conversion in factor_node["units"].items():
        if unit_name != factor_node["placeholder"]:
            if conversion>1:
                conversion_string= "1 "+unit_name+" = "+str(round(conversion,2))+ " "+factor_node["placeholder"]
            else:
                conversion_string = "1 "+factor_node["placeholder"]+ " = "+str(round(1/conversion,2))+ " "+ unit_name
            f.write("* "+unit_name+" ("+conversion_string+")\n")

def make_options_section(factor_node, node_name, f):
    text_available=get_text(node_name,"options","before")
    if text_available:
        f.write(text_available)
    else:
        f.write("The user has the following answer options\n\n")
    for option in factor_node["options"]:
        f.write("* "+option+"\n")
    add_text_if_there(f,node_name, "options", "after")

def write_domain(factor_node, domain, f):
    if "min" in factor_node[domain]:
        f.write(" larger than "+str(factor_node[domain]["min"])+" "+factor_node["placeholder"])
        if "max" in factor_node[domain]:
            f.write(" and")
    if "max" in factor_node[domain]:
        f.write(" smaller than "+str(factor_node[domain]["max"])+" "+factor_node["placeholder"])
    f.write(". ")

def make_limits_section(factor_node, node_name, f):
    text_available = get_text(node_name, "limits")
    if text_available:
        f.write(text_available)
    else:
        if "requiredDomain" in factor_node:
            f.write("The answer has to be")
            write_domain(factor_node, "requiredDomain",f)
        if "recommendedDomain" in factor_node:
             f.write("The answer is recommended to be")
             write_domain(factor_node, "recommendedDomain", f)
    add_text_if_there(f, node_name, "limits", "after")

def make_helpjson_section(factor_node, node_name, f):
    text_available = get_text(node_name, "helpjson")
    if text_available:
        f.write(text_available)
    elif "helpJson" in factor_node:
        f.write(factor_node["helpJson"]+"\n")
    add_text_if_there(f, node_name, "helpjson",beforeafter="after")

def make_optimizability_section(node_name, title, f):
    optim=get_optimizability(node_name)
    f.write("\n\n### Optimizability\n\n")
    f.write("[Optimizability](/model/optimizabilities) is a subjective measure that we have made to describe how easy it is to optimize a certain factor of your life. ")
    text_available=get_text(node_name, "optimizability")
    if text_available: 
        f.write(text_available)
    else:
        f.write("The optimizability of "+title+ " is "+str(OPTIM_DIC[optim])+". This means that it can be interpreted as\n\n")
    f.write("> *")
    f.write(OPTIM_DESCRIPTION_DIC[optim])
    f.write("*\n\n")
    add_text_if_there(f,node_name, "optimizability", "after")

def make_guidance_section(node_name, title, f):
    f.write("\n#### Guidance\n\n")
    factor_node=get_input_factor(node_name)
    add_text_if_there(f, node_name, "guidance", beforeafter="before")
    if factor_node["type"] == "string":
        f.write("The user input is chosen from a list and should answer the question\n\n")
    elif factor_node["type"] == "number":
        f.write("The user input is a typed number and should answer the question\n\n")
    f.write("> "+factor_node["question"]+"?\n\n")
    if factor_node["type"]=="number":
        f.write("The unit of the input is **"+factor_node["placeholder"]+"**")
        if "units" in factor_node:
            f.write(", but can be changed to any of the units below\n\n")
            make_units_table(factor_node,f)
            f.write("\n")
        else:
            f.write(".\n\n")
        make_limits_section(factor_node, node_name, f)
    elif factor_node["type"] == "string":
        make_options_section(factor_node, node_name, f)
    make_helpjson_section(factor_node, node_name, f)
    add_text_if_there(f,node_name,"guidance","after")



def make_interaction_description(node_name, title, rfgs, f):
    f.write("\n\n#### Interaction\n\n")

    RRs = get_risk_ratio_separated_factors(rfgs)
    RRterms = ["RR_{\\text{" + ",".join(map(lambda x: get_description(x, 12), node_group)) + "}}" for node_group in RRs]

    text_available=get_text(node_name,"interaction",)
    if text_available:
        f.write(text_available)
    else:
        f.write("The combined risk ratio of all risk factors is computed using the formula\n\n")

    f.write("$$\n\
RR=" + " \\cdot ".join(RRterms) + "\n\
$$\n\n")
    add_text_if_there(f,node_name,"interaction", "after")

    #Normalization factor
    node_groups = [get_all_nodes_of_riskfactorgroup(rfg) for _, rfg in rfgs]
    terms = ["P_{\\text{" + ",".join(map(lambda x: get_description(x, 12), node_group)) + "}}" for node_group in
             node_groups]

    text_available=get_text(node_name, "normalization")
    if text_available:
        f.write(text_available)
    else:
        f.write(
            "The normalization factor is based on the joint distribution of all the risk factors and is computed using the formula\n\n")

    f.write("$$\n\
P=" + " \\cdot ".join(terms) + "\n\
$$\n\n")
    add_text_if_there(f, node_name, "normalization", "after")

def fill_out_input_factor(node_name, title, f):
    f.write(title + " is a **input factor**. It means that it is one of ")
    f.write("the inputs from the user to the model.\n")
    add_text_if_there(f, node_name, "introduction", "after")
    alternative_names(node_name, f)
    make_list_of_descendants(node_name, title, f)
    make_guidance_section(node_name, title, f)
    make_optimizability_section(node_name,title,f)

def fill_out_compted_factor(node_name, title,f):
    f.write(title + " is a **computed factor**. It means that it can be determined with")
    f.write(" total certainty from the user input.\n")
    add_text_if_there(f, node_name, "introduction", "after")
    alternative_names(node_name, f)
    make_list_of_input_factors(node_name,title, f)
    make_list_of_descendants(node_name, title, f)
    make_optimizability_section(node_name,title,f)
    make_computation_section(node_name, title, f)

def fill_out_condition(node_name, title, f):
    f.write(title + " is a **condition**. It means that the model computes probabilities")
    f.write(" of getting or having it and uses that in further computations.\n")
    add_text_if_there(f, node_name, "introduction", "after")
    alternative_names(node_name, f)
    rfgs = get_all_risk_factor_groups(node_name)
    spfgs = get_all_special_factor_groups(node_name)
    make_list_of_risk_factors(node_name, title, rfgs, f)
    make_list_of_special_factors(node_name, title, spfgs, f)
    make_list_of_descendants(node_name, title, f)
    make_number_of_deaths_section(title, node_name, f, condition=True)
    if len(rfgs) > 0:
        make_interaction_description(node_name, title, rfgs, f)
    for _, rfg in rfgs:
        make_section_for_rfg(title, rfg, node_name, f)
    for spfg in spfgs:
        for rrt in spfg:
            factornames, factornames_raw, header, factorstring= make_header_of_rrt_section(rrt, f)
            factorstring_raw = "-".join(sorted(factornames_raw))
            add_text_if_there(f,node_name,"spt-"+factorstring_raw, "before")



def fill_out_death_cause(node_name, title, f):
    f.write(title + " is a **death cause**. It means that there is a certain probability that one dies from this.\n")
    add_text_if_there(f, node_name, "introduction", "after")
    alternative_names(node_name, f)
    make_list_of_deathcause_categories(node_name, title, f)
    rfgs = get_all_risk_factor_groups(node_name)
    make_list_of_risk_factors(node_name, title, rfgs, f)
    make_number_of_deaths_section(title, node_name, f)
    make_icd_definition(node_name, title,f)
    if len(rfgs) > 0:
        make_interaction_description(node_name, title, rfgs, f)
    for location_node, rfg in rfgs:
        if location_node == node_name:
            make_section_for_rfg(title, rfg, node_name, f)
        else:
            make_reference_to_rfg_section(title, rfg, location_node, f)


def fill_out_death_cause_category(node_name, title, f):
    f.write(
        title + " is a **death cause category**. It means that it is a collection of **death causes** and so we can compute the probability of dying from this death cause category by adding up all of its death causes. \n")
    add_text_if_there(f, node_name, "introduction", "after")
    alternative_names(node_name, f)
    make_list_of_death_cause_children(node_name, title, f)
    make_list_of_deathcause_categories(node_name, title, f, add_itself=True)
    rfgs = get_all_risk_factor_groups(node_name)
    make_list_of_risk_factors(node_name, title, rfgs, f)
    if len(rfgs):
        make_interaction_description(node_name, title, rfgs, f)
        load_R(f, use_cause_categories=True)
    for location_node, rfg in rfgs:
        if location_node == node_name:
            make_section_for_rfg(title, rfg, node_name, f)
        else:
            make_reference_to_rfg_section(title, rfg, location_node, f)

def createOptimizabilities():
    with open(os.path.join("resources", "optimizabilities.Rmd"), "w") as f:
        make_opener("Optimizabilities",f)
        add_text_if_there(f, "optimizabilities", "introduction","before")
        f.write("The different optimizabilities are\n\n")
        for optim in range(1,6):
            f.write("* "+OPTIM_DESCRIPTION_DIC[optim]+"\n")
        f.write("\n\n## Risk factors")
        for optim in range(1,6):
            f.write("\n\n#### Category "+str(optim)+"\n\n")
            f.write("Description: " + OPTIM_DESCRIPTION_DIC[optim]+"\n\n")
            f.write("Members:\n\n")
            for factor in sorted(get_factors_of_certain_optimizability(OPTIM_REVERSE_DIC[optim])):
                f.write("* ["+get_description(factor,40)+"](/model/"+ factor+")\n")


for k in relations:
    createRMD(k)
createOptimizabilities()
