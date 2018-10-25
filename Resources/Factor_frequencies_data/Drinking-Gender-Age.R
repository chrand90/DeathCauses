male=read.table("Drinking-Gender-Age raw male.txt")
female=read.table("Drinking-Gender-Age raw female.txt")
male=male[,-c(1,2,4,6,8,10,12)]
female=female[,-c(1,2,4,6,8,10,12)]
ages=c("-25","25-45","45-65","65-75","75+")
cnames_women=c("0","0-1","1-3","3-7","7-100")
cnames_men=c("0","0-1","1-3","3-14","14-100")
colnames(male)=cnames_men
colnames(female)=cnames_women
male$`3-7`=male$`3-14`*0.5
male$`7-14`=male$`3-14`*0.5
female$`7-14`=female$`7-100`*0.5
female$`14-100`=female$`7-100`*0.5
drops=c("3-14","7-100")
male=male[,!(names(male) %in% drops)]
female=female[,!(names(female) %in% drops)]
male$Age=ages
female$Age=ages
male$Gender="Male"
female$Gender="Female"
df=rbind(male,female)
View(df)


#reshaping
library(reshape2)
df.melt=melt(df, measure.vars = colnames(df)[1:6], variable.name="Drinking", value.name = "freq"  )
sum(df.melt$freq)

# here we multiply with the probability of belonging to the specific gender group. 
#Laziness has made me use this, because it should be cancelled out after the Gender-Age marginal has been applied.
#we also multiply with 1/100 because it is currently in percents
df.melt$freq=df.melt$freq*0.5*1/100

#saving
write.table(df.melt, "../../Database/Factor_frequencies/Drinking-Gender-Age_copy.txt", row.names = F, sep="\t")

