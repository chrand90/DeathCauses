getStartPoint=function(fromVal, step_size, startvalue){
  distanceToMinimumStart=fromVal-startvalue
  distanceToStart=ceiling(distanceToMinimumStart/step_size)*step_size
  start=startvalue+distanceToStart
  return(start)
}