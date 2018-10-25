
male=read.table("BMI-Gender-Age raw male.txt")
female=read.table("BMI-Gender-Age raw male.txt")
ages=c("-25","25-45","45-65","65-75","75+")
male$Age=ages
female$Age=ages
male$Gender="Male"
female$Gender="Female"
df=rbind(male,female)
df=df[,-c(1,2,4,6,8,10)]
View(df)

cnames=c("-18.5","18.5-25","25-30","30-50",colnames(df)[(ncol(df)-1):ncol(df)])
colnames(df) <- cnames

#reshaping
library(reshape2)
df.melt=melt(df, measure.vars = cnames[1:4], variable.name="BMI", value.name = "freq"  )
sum(df.melt$freq)

# here we multiply with the probability of belonging to the specific gender group. 
#Laziness has made me use this, because it should be cancelled out after the Gender-Age marginal has been applied.
#we also multiply with 1/100 because it is currently in percents
df.melt$freq=df.melt$freq*0.5*1/100

#saving
write.table(df.melt, "../../Database/Factor_frequencies/BMI-Gender-Age_copy.txt", row.names = F, sep="\t")
