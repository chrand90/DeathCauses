### Define classes -------



setClass("AgeGroups", slots=c(age_classification="character", age_prevalences="numeric"))

setClass("RiskFactorGroup", slots =c(normalisingFactors="AgeGroups",
                                     interactionFunction="character",
                                     riskRatioTables="list"))

setClass("Domain", slots=c(type="character",
                           lower="numeric",
                           upper="numeric",
                           value="numeric",
                           categorical="character",
                           label="character"))


setClass("MinLocation", slots=c(minValue="numeric",
                              minLocation="list"))

setClass("InterpolationCell", slots=c(interpolation_polynomial="list",
                                      interpolation_domains="list",
                                      non_interpolation_domains="list",
                                      lower_truncation="numeric",
                                      upper_truncation="numeric",
                                      value="numeric",
                                      min="list"))

setClass("InterpolationTable", slots=c(domainCollections="list",
                                       lower_truncation="numeric",
                                       upper_truncation="numeric",
                                       interpolation_variables="character",
                                       non_interpolation_variables="character",
                                       global_min="MinLocation",
                                       cells="list"))

setClass("RawRiskRatioTable", slots=c(factorNames="character",
                                      riskRatioRows="list",
                                      domainCollections="list"))

setClass("DomainCollection", slots=c(orderable="logical",
                                     labels="character",
                                     tickPositions="numeric",
                                     tickLabels="character",
                                     plottingBetweenPoints="numeric",
                                     plottingMidPoints="numeric",
                                     actualBetweenPointsWithoutInf="numeric",
                                     actualBetweenPoints="numeric",
                                     actualMidPoints="numeric",
                                     labelToDomain="list",
                                     labelToIndex="numeric"))

setClass("RiskRatioRow", slots=c(domains="list",
                                 RR="numeric"))

setClass("RiskRatioTable", slots= c(riskFactorNames="character",
                                    interpolationTable="InterpolationTable",
                                    rawRiskRatios="RawRiskRatioTable"))

setClass("Polynomial", slots= c(coefficients="numeric",
                                exponents="list"))
setClass("Disease", slots = c(Age="AgeGroups", RiskFactorGroups="list"))

setClass("Description", slots=c(names="character", color="character", baseUnit="character"))
setClass("Database", slots=c(diseases="list"))

de_null=function(val, res_initializer=character){
  if(is.null(val)){
    return(res_initializer())
  }
  return(val)

}

### formula parsing -------
formula_part=function(splitted_term){
  coefficient=as.numeric(splitted_term[1])
  exponents=numeric()
  if(length(splitted_term)>1){
    for(i in 2:length(splitted_term)){
      part=stringr::str_match(splitted_term[i], "x([0-9]+)\\^([0-9]+)")
      index=as.numeric(part[1,2])+1
      if(index>length(exponents)){
        exponents=c(exponents, rep(0, index-length(exponents)))
      }
      exponents[index]=as.numeric(part[1,3])
    }
  }
  formula_as_function=function(x){
    res=coefficient
    if(length(exponents)>0){
      for(i in 1:length(exponents)){
        if(exponents[i]>0){
          res=res*x[i]^exponents[i]
        }
      }
    }
    return(res)
  }
  return(formula_as_function)
}

### Initializers ------

initialize_domain=function(raw_element){
  if(grepl(",", raw_element)){
    lower_upper=stringr::str_split(raw_element, pattern=",")[[1]]
    if(lower_upper[1]!=""){
      lower=as.numeric(lower_upper[1])
      type="x-y"
    }
    else{
      lower=-Inf
      type="-x"
    }
    upper=as.numeric(lower_upper[2])
    value=numeric()
    categorical=character()
  }
  else if(grepl("\\+", raw_element)){
    lower=as.numeric(stringr::str_split(raw_element, pattern="\\+")[[1]][1])
    upper=Inf
    type="x+"
    value=numeric()
    categorical=character()
  }
  else if(!is.na(as.numeric(raw_element))){
    value=as.numeric(raw_element)
    lower=numeric()
    upper=numeric()
    type="x"
    categorical=character()
  }
  else{
    categorical=raw_element
    lower=numeric()
    upper=numeric()
    type="categorical"
    value=numeric()
  }
  return(new("Domain",
             categorical=categorical,
             lower=lower,
             upper=upper,
             type=type,
             value=value,
             label=raw_element))
}

extract_midpoint=function(type, lower, upper, width){
  if(type=="-x"){
    return(mean(c(upper, upper-width*0.75)))
  }
  if(type=="x+"){
    return(mean(c(lower, lower+width*0.75)))
  }
  else{
    return(mean(c(lower, upper)))
  }
}

initialize_domain_collection=function(domains){
  dictionary=list()
  numeric_values=c()
  numeric_midpoints=c()
  all_numeric=T
  for(domain in domains){
    if(!(domain@label %in% names(dictionary))){
      dictionary[[domain@label]] = domain
    }
  }
  for(domain in dictionary){
    if(domain@type!="categorical"){
      numeric_values=c(numeric_values, domain@value, domain@lower, domain@upper)
    }
    else{
      all_numeric=F
    }
  }
  if(all_numeric){
    betweens=sort(unique(numeric_values))
    safe_left_point=betweens[min(which(is.finite(betweens)))]
    safe_right_point=betweens[max(which(is.finite(betweens)))]
    width=safe_right_point-safe_left_point
    for(domain in dictionary){
      if(length(domain@value)>0){
        numeric_midpoints=c(numeric_midpoints, domain@value)
      }
      else{
        numeric_midpoints=c(numeric_midpoints, extract_midpoint(domain@type, domain@lower, domain@upper,width))
      }
    }
    domain_order=order(numeric_midpoints)
    adjustments=compute_adjustments_numeric(dictionary, domain_order, width)
  }
  else{
    domain_order=1:length(dictionary)
    numeric_midpoints=0:(length(dictionary)-1)+0.5
    numeric_values=0:length(dictionary)
    adjustments=compute_adjustments_categorical(dictionary)
  }
  actualMidPoints=sort(numeric_midpoints)
  actualBetweenPoints=sort(unique(numeric_values))
  labels=names(dictionary)[domain_order]
  labels_to_index=1:length(labels)
  names(labels_to_index) <- labels
  plottingBetweenPoints=adjustments$plottingBetweenPoints
  return(new("DomainCollection",
             orderable=all_numeric,
             labels=labels,
             tickPositions=adjustments$tickPositions,
             tickLabels=adjustments$tickLabels,
             plottingBetweenPoints=adjustments$plottingBetweenPoints,
             plottingMidPoints=adjustments$plottingMidPoints,
             actualBetweenPointsWithoutInf=adjustments$actualBetweenPointsWithoutInf,
             actualBetweenPoints=actualBetweenPoints,
             actualMidPoints=actualMidPoints,
             labelToDomain=dictionary,
             labelToIndex=labels_to_index))
}

initialize_domain_collection_dictionary=function(riskRatioRows, factorNames){
  res=list()
  n=length(factorNames)
  for(i in 1:n){
    domains=list()
    for(riskratioRow in riskRatioRows){
      domains[[length(domains)+1]] <- riskratioRow@domains[[i]]
    }
    res[[factorNames[i]]] <- initialize_domain_collection(domains)
  }
  return(res)
}

initialize_polynomial=function(pol_string){
  semi_parsed=stringr::str_split(stringr::str_split(pol_string, pattern="\\+")[[1]], pattern="\\*")
  part_functions=lapply(semi_parsed, formula_part)
  main_function=function(x){
    res=0
    for(p in part_functions){
      res=res+p(x)
    }
    return(res)
  }
  return(main_function)
}

initialize_cell=function(raw_element){
  if("min" %in% names(raw_element)){
    min_object=list(new("MinLocation", minValue=raw_element$min$minValue,
                   minLocation=raw_element$min$minLocation))
  }
  else{
    min_object=list()
  }
  if("interpolation_polynomial" %in% names(raw_element)){
    interpolation_polynomial_object=list(initialize_polynomial(raw_element$interpolation_polynomial))
  }
  else{
    interpolation_polynomial_object=list()
  }
  interpolation_domains=lapply(de_null(raw_element$interpolation_domains), initialize_domain)
  non_interpolation_domains=lapply(de_null(raw_element$non_interpolation_domains), initialize_domain)
  return(new("InterpolationCell",
             interpolation_polynomial=interpolation_polynomial_object,
             interpolation_domains=interpolation_domains,
             non_interpolation_domains=non_interpolation_domains,
             lower_truncation=de_null(raw_element$lower_truncation, numeric),
             upper_truncation=de_null(raw_element$upper_truncation, numeric),
             value=de_null(raw_element$value, numeric),
             min=min_object))
}

initialize_risk_ratio_row=function(raw_element){
  raw_domains=raw_element[[1]]
  value=as.numeric(raw_element[[2]])
  domains=lapply(raw_domains, initialize_domain)
  return(new("RiskRatioRow", domains=domains, RR=value))
}

initialize_risk_ratio_table=function(raw_element){
  riskRatioRows=lapply(raw_element$riskRatioTable, initialize_risk_ratio_row)
  domainCollections=initialize_domain_collection_dictionary(riskRatioRows, raw_element$riskFactorNames)
  rawRiskRatios=new("RawRiskRatioTable", riskRatioRows=riskRatioRows, factorNames=raw_element$riskFactorNames, domainCollections=domainCollections)
  global_min=new("MinLocation",
                 minValue=raw_element$interpolationTable$global_min$minValue,
                 minLocation=raw_element$interpolationTable$global_min$minLocation)
  cells=lapply(raw_element$interpolationTable$cells, initialize_cell)
  interpolationTable=new("InterpolationTable",
                         domainCollections=domainCollections,
                         lower_truncation=de_null(raw_element$interpolationTable$lower_truncation, numeric),
                         upper_truncation=de_null(raw_element$interpolationTable$upper_truncation,numeric),
                         non_interpolation_variables=de_null(raw_element$interpolationTable$non_interpolation_variables),
                         interpolation_variables=de_null(raw_element$interpolationTable$interpolation_variables),
                         global_min=global_min,
                         cells=cells)
    return(new("RiskRatioTable",
             riskFactorNames=raw_element$riskFactorNames,
             rawRiskRatios=rawRiskRatios,
             interpolationTable=interpolationTable))
}


initialize_risk_factor_group=function(raw_element){
  normalisingFactors=initialize_Age_object(raw_element$normalisingFactors)
  riskRatioTables=lapply(raw_element$riskRatioTables, initialize_risk_ratio_table)
  return(new("RiskFactorGroup", normalisingFactors=normalisingFactors,
                              interactionFunction=raw_element$interactionFunction,
                              riskRatioTables=riskRatioTables))
}

initialize_Age_object=function(raw_element){
  if(length(raw_element$age_classification)>0){
    age_classification_initializer=raw_element$age_classification
  }
  else{
    age_classification_initializer=character()
  }
  ageGroups=new("AgeGroups", age_classification=age_classification_initializer, age_prevalences=raw_element$age_prevalences)
  return(ageGroups)
}

initialize_description=function(node, name){
  return(new("Description",
             names=node$descriptions,
             color=node$color,
             baseUnit=node$baseUnit))
}


initialize_disease=function(raw_element){
  ageGroups=initialize_Age_object(raw_element$Age)
  riskfactorgroups=lapply(raw_element$RiskFactorGroups, initialize_risk_factor_group)
  return(new("Disease", Age=ageGroups, RiskFactorGroups=riskfactorgroups))
}

pkg.env <- new.env()

#' Initializes the descriptions file
#'
#' This function reads the json file from the hard drive and returns a list of description objects.
#'
#' @param json_filename path to the relations
#' @return a descriptions object
#' @export
initialize_descriptions=function(json_filename){
  raw_element=rjson::fromJSON(file=json_filename)
  descriptions= mapply(initialize_description, node=raw_element, name=names(raw_element), SIMPLIFY = F)
  pkg.env$descriptions <- descriptions
}

#' Initializes the database
#'
#' This function reads the json file from the hard drive and returns a database object.
#'
#' @param json_filename path to the database
#' @param relation_json_filename if supplied a path to the relation json file and it will save the variable for use in later functions.
#' @return a database object
#' @export
initialize_database=function(json_filename, relation_json_filename=NULL){
  if(!is.null(relation_json_filename)){
    initialize_descriptions(relation_json_filename)
  }
  raw_element=rjson::fromJSON(file=json_filename)
  return(new("Database", diseases=lapply(raw_element, initialize_disease)))
}


### setting methods ----
setMethod("dim",
          signature=(x="InterpolationTable"),
          function(x){
            return(length(x@interpolation_variables))
          })

setMethod("dim",
          signature(x="RawRiskRatioTable"),
          function(x){
            if(length(x@riskRatioRows)==0){
              return(0)
            }
            first_elements_domains=x@riskRatioRows[[1]]@domains
            return(length(first_elements_domains))
          })

setGeneric(name="getDescription",
           def=function(x,max_length,add_unit)
           {
             standardGeneric("getDescription")
           })

setMethod("getDescription",
          signature=c(x="Description", max_length="numeric", add_unit="logical"),
          function(x, max_length, add_unit=FALSE){
            candidate_length=0
            candidate_description=x@names[1]
            for(desc in x@names){
              if(nchar(desc)>=candidate_length && nchar(desc)<=max_length){
                candidate_length=nchar(desc)
                candidate_description=desc
              }
            }
            if(add_unit){
              if(nchar(x@baseUnit)>0){
                candidate_description=paste(candidate_description,
                                            paste0("(",x@baseUnit,")"))
              }
            }
            return(candidate_description)
          }
          )

get_description=function(factorname, max_length=20, add_unit=F){
  if(!is.null(pkg.env$descriptions)){
    describs=pkg.env$descriptions
    if(!is.null(describs[[factorname]])){
      describ=describs[[factorname]]
      return(getDescription(describ, max_length, add_unit))
    }
  }
  return(substr(factorname,1,floor(max_length)))
}

setGeneric(name="createPlottingDataframe",
           def=function(x)
           {
             standardGeneric("createPlottingDataframe")
           }
)

setGeneric(name="makePlot",
           def=function(x)
           {
             standardGeneric("makePlot")
           }
)
setMethod("createPlottingDataframe",
          signature=(x="RawRiskRatioTable"),
          function(x){
            dc=x@domainCollections
            if(dim(x)==2){
              dc1=dc[[x@factorNames[1]]]
              dc2=dc[[x@factorNames[2]]]
              df=matrix(0, nrow=0, ncol=5) #x,y,width,height, value
              for(row in x@riskRatioRows){
                RR=row@RR
                factorlevel1=row@domains[[1]]@label
                factorlevel2=row@domains[[2]]@label
                i1=dc1@labelToIndex[factorlevel1]
                i2=dc2@labelToIndex[factorlevel2]
                lower1=dc1@plottingBetweenPoints[i1]
                upper1=dc1@plottingBetweenPoints[i1+1]
                lower2=dc2@plottingBetweenPoints[i2]
                upper2=dc2@plottingBetweenPoints[i2+1]
                df=rbind(df,
                         c(lower1, lower2, upper1-lower1, upper2-lower2, RR))
              }
              df=data.frame(df)
              colnames(df) <- c("x","y","width","height","RR")
              return(df)
            }
            else if(dim(x)==1){
              dc=dc[[x@factorNames[1]]]
              df=matrix(0, nrow=0, ncol=3) #x,width,value
              for(row in x@riskRatioRows){
                RR=row@RR
                factorlevel=row@domains[[1]]@label
                i=dc@labelToIndex[factorlevel]
                lower=dc@plottingBetweenPoints[i]
                upper=dc@plottingBetweenPoints[i+1]
                df=rbind(df,
                         c(lower, upper-lower, RR))
              }
              df=data.frame(df)
              colnames(df) <- c("x","width","RR")
              return(df)
            }
          })

setMethod("range",
          signature = (x="DomainCollection"),
          function(x){
            lastPoint=x@actualBetweenPointsWithoutInf[length(x@actualBetweenPointsWithoutInf)]
            firstPoint=x@actualBetweenPointsWithoutInf[1]
            return(c(firstPoint,lastPoint))
          })

setMethod("createPlottingDataframe",
          signature=(x="InterpolationTable"),
          function(x){
            n=dim(x)
            if(n<1 || n>2){
              stop("cant create a plotting dataframe for interpolation of that size")
            }
            if(n==1){
              fname=x@interpolation_variables[1]
              dc=x@domainCollections[[fname]]
              width=diff(range(dc))
              xaxisStartValue=range(dc)[1]
              step_size=width/50
            }
            if(n==2){
              fnames=x@interpolation_variables
              dc1=x@domainCollections[[fnames[1]]]
              dc2=x@domainCollections[[fnames[2]]]
              step_size1=diff(range(dc1))/50
              step_size2=diff(range(dc2))/50
              xaxisStartValue1=range(dc1)[1]
              xaxisStartValue2=range(dc2)[1]
            }
            dfmat=matrix(0, nrow=0, ncol=n+2)
            truncate_indicators=logical()
            non_ints=matrix("", nrow=0, ncol=length(x@non_interpolation_variables))
            if(n==1){
              for(cell in x@cells){
                i=dc@labelToIndex[cell@interpolation_domains[[1]]@label]
                fromVal=dc@actualBetweenPointsWithoutInf[i]
                startVal=getStartPoint(fromVal, step_size, xaxisStartValue)
                toVal=dc@actualBetweenPointsWithoutInf[i+1]-1e-5
                if(startVal<toVal){
                  for(xval in seq(startVal,toVal, step_size)){
                    z=cell@interpolation_polynomial[[1]](xval)
                    outp=truncater(z, x,cell)
                    truncate_indicators=c(truncate_indicators, outp$truncate)
                    z_valid=outp$znew
                    non_ints=rbind(non_ints, sapply(cell@non_interpolation_domains, function(y) {y@label}))
                    dfmat=rbind(dfmat, c(xval,z_valid, z))
                  }
                }
              }
              df=data.frame(dfmat)
              colnames(df) <- c(fname,"RR","RR_untruncated")
              df$truncated=truncate_indicators
              if(!is.null(non_ints)){
                oldcolnames=colnames(df)
                df=cbind(df,non_ints)
                colnames(df) <- c(oldcolnames, x@non_interpolation_variables)
              }
              return(df)
            }
            if(n==2){
              for(cell in x@cells){
                i1=dc1@labelToIndex[cell@interpolation_domains[[1]]@label]
                i2=dc2@labelToIndex[cell@interpolation_domains[[2]]@label]
                fromVal1=dc1@actualBetweenPointsWithoutInf[i1]
                toVal1=dc1@actualBetweenPointsWithoutInf[i1+1]-1e-5
                fromVal2=dc2@actualBetweenPointsWithoutInf[i2]
                toVal2=dc2@actualBetweenPointsWithoutInf[i2+1]-1e-5
                startVal1=getStartPoint(fromVal1, step_size1, xaxisStartValue1)
                startVal2=getStartPoint(fromVal2, step_size2, xaxisStartValue2)
                if(startVal1<toVal1 && startVal2<toVal2){
                  for(x0val in seq(startVal1,toVal1, step_size1)){
                    for(x1val in seq(startVal2,toVal2, step_size2)){
                      z=cell@interpolation_polynomial[[1]](c(x0val,x1val))
                      outp=truncater(z, x,cell)
                      truncate_indicators=c(truncate_indicators, outp$truncate)
                      z_valid=outp$znew
                      non_ints=rbind(non_ints, sapply(cell@non_interpolation_domains, function(y) {y@label}))
                      dfmat=rbind(dfmat, c(x0val,x1val,z_valid, z))
                    }
                  }
                }


              }
              df=data.frame(dfmat)
              colnames(df) <- c(fnames,"RR","RR_untruncated")
              df$truncated=truncate_indicators
              if(!is.null(non_ints)){
                oldcolnames= colnames(df)
                df=cbind(df,non_ints)
                colnames(df) <- c(oldcolnames, x@non_interpolation_variables)
              }
              return(df)
            }
          })

setMethod("makePlot",
          signature=(x="AgeGroups"),
          function(x){
            if(length(x@age_classification)>0){
              stop("has not implemented age plot with non-standard age cagetories")
            }
            standard_ages=c(0,1,seq(5,105,5))
            ages=standard_ages
            barwidths=diff(ages)
            age_plot = ggplot2::ggplot(data=data.frame(y=x@age_prevalences,
                                              x=ages[-length(ages)]+barwidths/2,
                                              w=barwidths),
                                       ggplot2::aes(x=x,y=y,width=w*0.95, fill=y))+
              ggplot2::geom_col()+ggplot2::scale_x_continuous(breaks=ages,
                                            labels=ages)+
              ggplot2::guides(fill=FALSE)+
              ggplot2::xlab('Age')+
              ggplot2::ylab("Base death rate")+
              ggplot2::scale_fill_gradient(low = "blue", high = "purple", na.value = NA)
            return(list(age_plot))
          })

setMethod("makePlot",
          signature=(x="InterpolationTable"),
          function(x){
            p_df=createPlottingDataframe(x)
            fnames=x@interpolation_variables
            cnames=x@non_interpolation_variables
            fnames_actual=sapply(fnames, get_description, add_unit=T)
            cnames_actual=sapply(cnames, get_description)
            if(length(cnames)>0){
              p_df$non_interpolation_combinations=interaction(p_df[,cnames], sep=":")
              plist=list()
              for(f in levels(p_df$non_interpolation_combinations)){
                non_interpolation_domains=strsplit(f, ":")[[1]]
                fixed_val_string=paste(cnames_actual,non_interpolation_domains, sep="=", collapse=",")
                subtitle=paste("For ", fixed_val_string)
                filtered_df=dplyr::filter(p_df, non_interpolation_combinations==f)
                if(dim(x)==2){
                  p <- ggplot2::ggplot(filtered_df, ggplot2::aes(x=!!dplyr::sym(fnames[1]),
                                                               y=!!dplyr::sym(fnames[2]),
                                                               z=RR))+
                    ggplot2::geom_contour_filled() +
                    ggplot2::geom_tile(data=dplyr::filter(filtered_df, truncated==TRUE),
                              mapping=ggplot2::aes(x=!!dplyr::sym(fnames[1]),
                                          y=!!dplyr::sym(fnames[2]),
                                          color=truncated,
                                          alpha=0))+
                    ggplot2::ggtitle(label="Interpolated Risk Ratios", subtitle=subtitle)+
                    ggplot2::guides(alpha=FALSE)+
                    ggplot2::labs(x=fnames_actual[1], y=fnames_actual[2])
                  plist[[length(plist)+1]] <- p
                }
                else{
                  filtered_df$Riskratio="Actual"
                  filtered_df %>%
                    dplyr::filter(truncated==TRUE) %>%
                    dplyr::mutate(RR=RR_untruncated) %>%
                    dplyr::mutate(Riskratio="Unbounded") %>%
                    rbind(filtered_df) -> filtered_df
                  p <- ggplot2::ggplot(filtered_df, ggplot2::aes(x=!!dplyr::sym(fnames[1]), y=RR, linetype=Riskratio))+
                    ggplot2::geom_line() + ggplot2::ylim(c(0,max(p_df$RR)))+
                    ggplot2::scale_linetype_manual(values=c(Actual="solid", Unbounded="dashed"))+
                    ggplot2::ggtitle(label="Interpolated Risk Ratios", subtitle=subtitle)+
                    ggplot2::labs(x=fnames_actual[1])
                  plist[[length(plist)+1]] <- p
                }
              }
              return(plist)
            }
            else{
              if(dim(x)==1){
                p_df$Riskratio="Actual"
                p_df %>%
                  dplyr::mutate(RR=ifelse(truncated==TRUE, RR_untruncated, NA)) %>%
                  dplyr::mutate(Riskratio="Unbounded") %>%
                  rbind(p_df) -> p_df
                p <- ggplot2::ggplot(p_df, ggplot2::aes(x=!!dplyr::sym(fnames[1]), y=RR, linetype=Riskratio))+
                  ggplot2::geom_line() + ggplot2::ylim(c(0,max(p_df$RR)))+
                  ggplot2::scale_linetype_manual(values=c(Actual="solid", Unbounded="dashed"))+
                  ggplot2::ggtitle(label="Interpolated Risk Ratios")+
                  ggplot2::labs(x=fnames_actual[1])
                return(list(p))
              }
              if(dim(x)==2){
                truncated_df=dplyr::filter(p_df, truncated==TRUE)
                p <- ggplot2::ggplot(p_df, ggplot2::aes(x=!!dplyr::sym(fnames[1]),
                                             y=!!dplyr::sym(fnames[2]),
                                             z=RR))+
                  ggplot2::geom_contour_filled()+
                  ggplot2::ggtitle(label="Interpolated Risk Ratios")+
                  ggplot2::labs(x=fnames_actual[1], y=fnames_actual[2])
                if(nrow(truncated_df)>0){
                  p <- p +
                    ggplot2::geom_tile(data=truncated_df,
                              mapping=ggplot2::aes(x=!!dplyr::sym(fnames[1]),
                                          y=!!dplyr::sym(fnames[2]),
                                          color=truncated,
                                          alpha=0))+ggplot2::guides(alpha=FALSE)
                }
                return(list(p))
              }
            }
          })

setMethod("makePlot",
          signature=(x="RawRiskRatioTable"),
          function(x){
            n=dim(x)
            if(n<1 || n>2){
              stop(paste("Cant plot a riskratiotable of dimension",n))
            }
            df=createPlottingDataframe(x)
            if(n==1){
              fname=x@factorNames[1]
              fname_actual=get_description(fname, add_unit = T)
              dc=x@domainCollections[[fname]]
              p <- ggplot2::ggplot(df, ggplot2::aes(x=x+width/2,y=RR, width=width*0.95, fill=RR))+
                ggplot2::geom_bar(stat='identity', orientation="x")+
                ggplot2::scale_x_continuous(breaks=dc@tickPositions, labels = dc@tickLabels)+
                ggplot2::scale_fill_gradient(low = "yellow", high = "red", na.value = NA)+
                ggplot2::xlab(fname_actual)+ggplot2::ylab('RR')+ggplot2::theme_bw()+ggplot2::guides(fill=FALSE)+
                ggplot2::ggtitle('Risk ratio bar graph')
              return(list(p))
            }
            if(n==2){
              fnames=x@factorNames
              fnames_actual=sapply(fnames, get_description, add_unit=T)
              dc1=x@domainCollections[[fnames[1]]]
              dc2=x@domainCollections[[fnames[2]]]
              p<- ggplot2::ggplot(df, ggplot2::aes(x=x+width/2,y=y+height/2, height=height*0.95, width=width*0.95, fill=RR))+
                ggplot2::geom_tile()+ggplot2::theme_bw()+
                ggplot2::scale_x_continuous(breaks = dc1@tickPositions,
                                   labels = dc1@tickLabels) +
                ggplot2::scale_y_continuous(breaks = dc2@tickPositions,
                                   labels = dc2@tickLabels) +
                ggplot2::scale_fill_gradient(low = "yellow", high = "red", na.value = NA)+
                ggplot2::ggtitle('Risk ratio matrix')+ggplot2::guides(fill=FALSE)+
                ggplot2::xlab(fnames_actual[1])+ggplot2::ylab(fnames_actual[2])+
                ggplot2::geom_text(ggplot2::aes(x=x+width/2,y=y+height/2, label=round(RR, digits=1)), color='black')
              return(list(p))
            }
          })

setMethod("plot",
          signature=(x="InterpolationTable"),
          function(x, fixed_height=F){
            do.call(gridExtra::grid.arrange, makePlot(x))
          }
          )

setMethod("plot",
          signature=(x="RawRiskRatioTable"),
          function(x){
            print(makePlot(x)[[1]])
          }
          )

setMethod("plot",
          signature=(x="AgeGroups"),
          function(x){
            print(makePlot(x)[[1]])
          }
)

setMethod("makePlot",
          signature=(x="RiskRatioTable"),
          function(x){
            plots=makePlot(x@rawRiskRatios)
            if(dim(x@interpolationTable)>0){
              plots=c(plots, makePlot(x@interpolationTable))
            }
            return(plots)
          })

setMethod("makePlot",
          signature=(x="RiskFactorGroup"),
          function(x){
            unflattened_plots=lapply(x@riskRatioTables, makePlot)
            return(do.call(c, unflattened_plots))
          })

#' Makes plots
#'
#' This function makes a list of all the plots that are relevant to the specified disease.
#'
#' @param x disease object which is any sub element of the database object.
#' @return A list of plots.
#' @export
setMethod("makePlot",
          signature=(x="Disease"),
          function(x){
            age_plot=makePlot(x@Age)
            unflattened_plots=lapply(x@RiskFactorGroups, makePlot)
            flattened_plots=do.call(c, unflattened_plots)
            res=c(age_plot,flattened_plots)
            return(res)
          })








#' Make a specific plot
#'
#' This function makes the requested plot from the database
#'
#' @param all_diseases Database object initialized by initialize_database
#' @param diseaseName the name of the disease that contains the requested plot. A string.
#' @param riskfactors a vector of the riskfactornames for the plot you want
#' @param plot_type the type of plot you want
#' @return a list of plots that can later be combined to something
#' @export
generateSpecificPlots=function(all_diseases, diseaseName, riskfactors, plot_type=c("raw","interpolated")){
  disease=all_diseases@diseases[[diseaseName]]
  if(length(riskfactors)==0){
    return(makePlot(disease@Age))
  }
  for(riskfactorgroup in disease@RiskFactorGroups){
    for(riskratiotable in riskfactorgroup@riskRatioTables){
      if(paste(sort(riskfactors), collapse=".")==paste(sort(riskratiotable@riskFactorNames), collapse=".")){
        if(plot_type[1]=="raw"){
          return(makePlot(riskratiotable@rawRiskRatios))
        }
        else if(plot_type[1]=="interpolated"){
          return(makePlot(riskratiotable@interpolationTable))
        }
      }
    }
  }
  stop("couldnt find the requested plot")
}

#' Plot a specific plot
#'
#' This function plots the requested plot from the database
#'
#' @param all_diseases Database object initialized by initialize_database
#' @param diseaseName the name of the disease that contains the requested plot. A string.
#' @param riskfactors a vector of the riskfactornames for the plot you want
#' @param plot_type the type of plot you want
#' @return will simply plot the plot
#' @export
plotSpecificPlots=function(all_diseases, diseaseName, riskfactors, plot_type=c("raw","interpolated")){
  disease=all_diseases@diseases[[diseaseName]]
  plotted_anything=F
  if(length(riskfactors)==0){
    plot(disease@Age)
    plotted_anything=T
  }
  for(riskfactorgroup in disease@RiskFactorGroups){
    for(riskratiotable in riskfactorgroup@riskRatioTables){
      if(paste(sort(riskfactors), collapse=".")==paste(sort(riskratiotable@riskFactorNames), collapse=".")){
        if(plot_type[1]=="raw"){
          plot(riskratiotable@rawRiskRatios)
          plotted_anything=T
        }
        else if(plot_type[1]=="interpolated"){
          plot(riskratiotable@interpolationTable)
          plotted_anything=T
        }
      }
    }
  }
  if(!plotted_anything){
    stop("could not find the requested plot")
  }

}



#
# View(all_diseases)
#
# plot(all_diseases$LiverCancer@RiskFactorGroups[[1]]@riskRatioTables[[1]]@interpolationTable)
#
# plot(all_diseases$BrainCancer@RiskFactorGroups[[1]]@riskRatioTables[[1]]@rawRiskRatios)
# plot(all_diseases$BrainCancer@RiskFactorGroups[[1]]@riskRatioTables[[1]]@interpolationTable)
# plot(all_diseases$LiverCancer@RiskFactorGroups[[1]]@riskRatioTables[[1]]@rawRiskRatios)
#
# plot(all_diseases$Ischemic@RiskFactorGroups[[2]]@riskRatioTables[[1]]@interpolationTable)
#
# plot(all_diseases$LungCancer@RiskFactorGroups[[1]]@riskRatioTables[[1]]@interpolationTable)
# plot(p_df$SmokeTypicalAmount, p_df$SmokeSinceStop)
# p_df %>% arrange(SmokeTypicalAmount, SmokeSinceStop) -> p_df
# ggplot(p_df, aes(x=SmokeSinceStop,
#                  y=SmokeTypicalAmount,
#                  z=RR))+
#   geom_contour_filled() +
#   geom_tile(data=filter(p_df, truncated==TRUE),
#             mapping=aes(x=SmokeSinceStop,
#                         y=SmokeTypicalAmount,
#                         color=truncated))
# r=plot(all_diseases$Alzheimers@RiskFactorGroups[[1]]@riskRatioTables[[1]]@interpolationTable)
# r= plot(all_diseases$Alzheimers@RiskFactorGroups[[2]]@riskRatioTables[[1]]@interpolationTable)
# plot(all_diseases$Alzheimers@RiskFactorGroups[[3]]@riskRatioTables[[1]]@interpolationTable)
