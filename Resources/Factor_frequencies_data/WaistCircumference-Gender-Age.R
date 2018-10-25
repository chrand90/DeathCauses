percentiles=c(5,10,15,25,50,75,85,90,95)*0.01
male=read.table("WaistCircumference-Gender-Age raw male.txt",skip=1)
female=read.table("WaistCircumference-Gender-Age raw male.txt", skip=1)
ages=c("-30",paste0((3:7)*10,"-",(4:8)*10),"80+")
male$Age=ages
female$Age=ages
male$Gender="Male"
female$Gender="Female"
df=rbind(male,female)
df=df[,-(1:4)]

source("standard_transformations.R")

#transforming percentiles to desired.
desired.values=c(70,80,90,100,110,120,130,160)
new_mat=t(apply(df, 1, function(x){
  percentile_to_fixed(c(0,percentiles,1), values=c(70,as.numeric(x[1:9]),160), new_breaks = desired.values)
}))
df=cbind(df,new_mat)
df=df[,-(1:9)]
colnames(df) <- c(colnames(df)[1:2], "-80",paste0(desired.values[2:7],"-", desired.values[3:8]))
df$`160+`=0

#reshaping
library(reshape2)
df.melt=melt(df, measure.vars = colnames(df)[3:length(colnames(df))], variable.name="WaistCircumference", value.name = "freq"  )
sum(df.melt$freq)

# here we multiply with the probability of belonging to the specific gender group. 
#Laziness has made me use this, because it should be cancelled out after the Gender-Age marginal has been applied.
df.melt$freq=df.melt$freq*0.5 

#saving
write.table(df.melt, "../../Database/Factor_frequencies/WaistCircumference-Gender-Age_copy.txt", row.names = F, sep="\t")
