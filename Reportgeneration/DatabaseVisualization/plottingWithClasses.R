library(rjson)
library(stringr)
library(plotly)
library(grid)
library(gridExtra)
source("adjust_ticks.R")
source("truncate.R")
source("smallHelpers.R")
standard_ages=c(0,1,seq(5,105,5))
standard_ages_string=as.character(standard_ages)
standard_ages_string[length(standard_ages_string)]='Inf'
barwidths=diff(standard_ages)
dat=fromJSON(file = '../../death-causes-app/src/resources/Causes.json')


### Define classes -------
setClass("Disease", slots = c(Age="AgeGroups", RiskFactorGroups="list"))

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
      part=str_match(splitted_term[i], "x([0-9]+)\\^([0-9]+)")
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
    lower_upper=str_split(raw_element, pattern=",")[[1]]
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
    lower=as.numeric(str_split(raw_element, pattern="\\+")[[1]][1])
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
  semi_parsed=str_split(str_split(pol_string, pattern="\\+")[[1]], pattern="\\*")
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

initialize_disease=function(raw_element){
  ageGroups=initialize_Age_object(raw_element$Age)
  riskfactorgroups=lapply(raw_element$RiskFactorGroups, initialize_risk_factor_group)
  return(new("Disease", Age=ageGroups, RiskFactorGroups=riskfactorgroups))
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

standard_ages=c(0,1,seq(5,105,5))
setMethod("makePlot",
          signature=(x="AgeGroups"),
          function(x){
            if(length(x@age_classification)>0){
              stop("has not implemented age plot with non-standard age cagetories")
            }
            ages=standard_ages
            barwidths=diff(ages)
            age_plot = ggplot(data=data.frame(y=x@age_prevalences, 
                                              x=ages[-length(ages)]+barwidths/2,
                                              w=barwidths),
                              aes(x=x,y=y,width=w*0.95, fill=y))+
              geom_col()+scale_x_continuous(breaks=ages,
                                            labels=ages)+
              guides(fill=FALSE)+
              xlab('Age')+
              ylab("Base death rate")+
              scale_fill_gradient(low = "blue", high = "purple", na.value = NA)
            return(list(age_plot))
          })

setMethod("makePlot",
          signature=(x="InterpolationTable"),
          function(x){
            p_df=createPlottingDataframe(x)
            fnames=x@interpolation_variables
            cnames=x@non_interpolation_variables
            if(length(cnames)>0){
              p_df$non_interpolation_combinations=interaction(p_df[,cnames], sep=":")
              plist=list()
              for(f in levels(p_df$non_interpolation_combinations)){
                non_interpolation_domains=strsplit(f, ":")[[1]]
                fixed_val_string=paste(cnames,non_interpolation_domains, sep="=", collapse=",")
                subtitle=paste("For ", fixed_val_string)
                filtered_df=filter(p_df, non_interpolation_combinations==f)
                if(dim(x)==2){
                  p <- ggplot(filtered_df, aes(x=!!sym(fnames[1]), 
                                                               y=!!sym(fnames[2]), 
                                                               z=RR))+ 
                    geom_contour_filled() + 
                    geom_tile(data=filter(filtered_df, truncated==TRUE), 
                              mapping=aes(x=!!sym(fnames[1]), 
                                          y=!!sym(fnames[2]), 
                                          color=truncated,
                                          alpha=0))+
                    ggtitle(label="Interpolated Risk Ratios", subtitle=subtitle)+
                    guides(alpha=FALSE)
                  plist[[length(plist)+1]] <- p
                }
                else{
                  filtered_df$Riskratio="Actual"
                  filtered_df %>% 
                    filter(truncated==TRUE) %>% 
                    mutate(RR=RR_untruncated) %>%
                    mutate(Riskratio="Unbounded") %>%
                    rbind(filtered_df) -> filtered_df
                  p <- ggplot(filtered_df, aes(x=!!sym(fnames[1]), y=RR, linetype=Riskratio))+
                    geom_line() + ylim(c(0,max(p_df$RR)))+
                    scale_linetype_manual(values=c(Actual="solid", Unbounded="dashed"))+
                    ggtitle(label="Interpolated Risk Ratios", subtitle=subtitle)
                  plist[[length(plist)+1]] <- p
                }
              }
              return(plist)
            }
            else{
              if(dim(x)==1){
                p_df$Riskratio="Actual"
                p_df %>% 
                  mutate(RR=ifelse(truncated==TRUE, RR_untruncated, NA)) %>%
                  mutate(Riskratio="Unbounded") %>%
                  rbind(p_df) -> p_df
                p <- ggplot(p_df, aes(x=!!sym(fnames[1]), y=RR, linetype=Riskratio))+
                  geom_line() + ylim(c(0,max(p_df$RR)))+
                  scale_linetype_manual(values=c(Actual="solid", Unbounded="dashed"))+
                  ggtitle(label="Interpolated Risk Ratios")
                return(list(p))
              }
              if(dim(x)==2){
                truncated_df=filter(p_df, truncated==TRUE)
                p <- ggplot(p_df, aes(x=!!sym(fnames[1]), 
                                             y=!!sym(fnames[2]), 
                                             z=RR))+ 
                  geom_contour_filled() 
                  ggtitle(label="Interpolated Risk Ratios")
                if(nrow(truncated_df)>0){
                  p <- p + 
                    geom_tile(data=truncated_df, 
                              mapping=aes(x=!!sym(fnames[1]), 
                                          y=!!sym(fnames[2]), 
                                          color=truncated,
                                          alpha=0))+guides(alpha=FALSE)
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
              dc=x@domainCollections[[fname]]
              p <- ggplot(df, aes(x=x+width/2,y=RR, width=width*0.95, fill=RR))+
                geom_bar(stat='identity', orientation="x")+
                scale_x_continuous(breaks=dc@tickPositions, labels = dc@tickLabels)+
                scale_fill_gradient(low = "yellow", high = "red", na.value = NA)+
                xlab(fname)+ylab('RR')+theme_bw()+guides(fill=FALSE)+
                ggtitle('Risk ratio bar graph')
              return(list(p))
            }
            if(n==2){
              fnames=x@factorNames
              dc1=x@domainCollections[[fnames[1]]]
              dc2=x@domainCollections[[fnames[2]]]
              p<- ggplot(df, aes(x=x+width/2,y=y+height/2, height=height*0.95, width=width*0.95, fill=RR))+
                geom_tile()+theme_bw()+
                scale_x_continuous(breaks = dc1@tickPositions,
                                   labels = dc1@tickLabels) + 
                scale_y_continuous(breaks = dc2@tickPositions,
                                   labels = dc2@tickLabels) + 
                scale_fill_gradient(low = "yellow", high = "red", na.value = NA)+
                ggtitle('Risk ratio matrix')+guides(fill=FALSE)+
                xlab(fnames[1])+ylab(fnames[2])+
                geom_text(aes(x=x+width/2,y=y+height/2, label=round(RR, digits=1)), color='black')
              return(list(p))
            }
          })

setMethod("plot",
          signature=(x="InterpolationTable"),
          function(x, fixed_height=F){
            g <- do.call(grid.arrange, makePlot(x))
            print(g)
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

setMethod("makePlot",
          signature=(x="Disease"),
          function(x){
            age_plot=makePlot(x@Age)
            unflattened_plots=lapply(x@RiskFactorGroups, makePlot)
            flattened_plots=do.call(c, unflattened_plots)
            res=c(age_plot,flattened_plots)
            return(res)
          })







### Actually computing ------
all_diseases=lapply(dat, initialize_disease)

generateSpecificPlots=function(diseaseName, riskfactors, plot_type=c("raw","interpolated")){
  disease=all_diseases[[diseaseName]]
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

plotSpecificPlots=function(diseaseName, riskfactors, plot_type=c("raw","interpolated")){
  disease=all_diseases[[diseaseName]]
  if(length(riskfactors)==0){
    return(plot(disease@Age))
  }
  for(riskfactorgroup in disease@RiskFactorGroups){
    for(riskratiotable in riskfactorgroup@riskRatioTables){
      if(paste(sort(riskfactors), collapse=".")==paste(sort(riskratiotable@riskFactorNames), collapse=".")){
        if(plot_type[1]=="raw"){
          return(plot(riskratiotable@rawRiskRatios))
        }
        else if(plot_type[1]=="interpolated"){
          return(plot(riskratiotable@interpolationTable))
        }
      }
    }
  }
  stop("couldnt find the requested plot")
}

#makePlot(all_diseases$Alzheimers)

p<- generateSpecificPlots( 
                      "CervixCancer", 
                      c("Sex"))


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
