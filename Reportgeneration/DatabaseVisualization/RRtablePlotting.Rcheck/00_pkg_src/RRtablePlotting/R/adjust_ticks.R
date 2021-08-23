compute_adjustments_numeric=function(dictionary, domain_order, width){
 no_domains=length(dictionary)
 degenerateCategoryWidth=1/no_domains/4*width
 infinity_length=width*0.75
 tickPositions=numeric()
 tickLabels=character()
 plottingBetweenPoints=numeric()
 plottingMidPoints=numeric()
 actualBetweenPointsWithoutInf=numeric()
 previousInterval="none"
  for(i in domain_order){
    domain=dictionary[[names(dictionary)[i]]]
    if(domain@type=="x"){
      if(previousInterval=="none"){
        actualBetweenPointsWithoutInf=c(domain@value, domain@value)
        tickPositions=domain@value+degenerateCategoryWidth/2
        plottingBetweenPoints=c(domain@value, domain@value+degenerateCategoryWidth)
        plottingMidPoints=domain@value+degenerateCategoryWidth/2
        tickLabels=domain@value
      }
      else if(previousInterval=="interval"){
        actualBetweenPointsWithoutInf=c(actualBetweenPointsWithoutInf, domain@value)
        newLeftPlot=plottingBetweenPoints[length(plottingBetweenPoints)]-degenerateCategoryWidth/2
        plottingBetweenPoints=c(plottingBetweenPoints[-1], newLeftPlot,newLeftPlot+degenerateCategoryWidth)
        plottingMidPoints=c(plottingMidPoints, domain@value)
      }
      previousInterval="degenerate"
    }
    else if(domain@type=="-x"){
      tickPositions=c(domain@upper-infinity_length, domain@upper)
      tickLabels=c('-Inf', domain@upper)
      actualBetweenPointsWithoutInf=tickPositions
      plottingBetweenPoints=c(domain@upper-infinity_length, domain@upper)
      plottingMidPoints=mean(plottingBetweenPoints)
      previousInterval="interval"
    }
    else if(domain@type=="x-y" || domain@type=="x+"){
      upper=domain@upper
      upper_label=domain@upper
      if(domain@type=="x+"){
        upper=domain@lower+infinity_length
        upper_label="Inf"
      }
      if(previousInterval=="none"){
        tickPositions=c(domain@lower,upper)
        actualBetweenPointsWithoutInf=tickPositions
        tickLabels=c(domain@lower, upper_label)
        plottingBetweenPoints=c(domain@lower, upper)
        plottingMidPoints=mean(plottingBetweenPoints)
      }
      if(previousInterval=="interval" || previousInterval=="degenerate"){
        actualBetweenPointsWithoutInf=c(actualBetweenPointsWithoutInf, upper)
        tickPositions=c(tickPositions, upper)
        tickLabels=c(tickLabels, upper_label)
        previousPlottingPoint=plottingBetweenPoints[length(plottingBetweenPoints)]
        plottingBetweenPoints=c(plottingBetweenPoints, upper)
        midpoint=mean(c(previousPlottingPoint, upper))
        plottingMidPoints=c(plottingMidPoints, midpoint)
      }
      previousInterval="interval"
    }
  }
 outp=list()
 outp$tickPositions=tickPositions
 outp$tickLabels=tickLabels
 outp$plottingBetweenPoints=plottingBetweenPoints
 outp$plottingMidPoints=plottingMidPoints
 outp$actualBetweenPointsWithoutInf=actualBetweenPointsWithoutInf
 return(outp)
}

compute_adjustments_categorical=function(dictionary){
  outp=list()
  outp$tickPositions=0:(length(dictionary)-1)+0.5
  outp$tickLabels=c()
  for(d in dictionary){
    outp$tickLabels=c(outp$tickLabels, d@categorical)  
  }
  outp$plottingBetweenPoints=0:length(dictionary)
  outp$plottingMidPoints=0:(length(dictionary)-1)+0.5
  outp$actualBetweenPointsWithoutInf=0:length(dictionary)
  return(outp)
}


