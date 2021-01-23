library(rjson)

PATH_TO_Causes.json='../'
NEW_FILE_NAME='Causes_and_psis.json'

read_database=function(){
  return(fromJSON(file = paste0(PATH_TO_Causes.json,'Causes.json')))
}

write_database=function(new_database){
  write(toJSON(new_database), paste0(PATH_TO_Causes.json, NEW_FILE_NAME))
}

compute_and_insert_critical_points=function(database){

  #Code goes here...
}

#run the function
new_database=compute_and_insert_critical_points(read_database())
write_new_database(new_database)


### TESTING
test_dat1=list(
  OldAge=list(
    RiskFactorGroups=list(
      list(
        riskRatioTables=list(
          riskFactorNames=c("Smoking"),
          interpolationTable=list(
            list( 
              domain="0,2.5",
              factors="Smoking",
              interpolationPolynomial="1+0.5*x0^2+-1.234*x0^1",
              minValue="1",
              maxValue="10"
            ),
            list(
              domain="-4,0",
              factors="Smoking",
              interpolationPolynomial="1+-0.4*x0^1",
              minValue="1",
              maxValue="10"
            ),
            list( #remember to ignore this interval when finding minimum because it is infinitely long
              domain=",-4",
              factors="Smoking",
              interpolationPolynomial="1+-0.4*x0^1",
              minValue="1",
              maxValue="10"
            ),
            list(# ignore also this interval because it is just an edge case of the other cells
              domain="2.5", 
              factors="Smoking",
              interpolationPolynomial="1.04",
              minValue="1",
              maxValue="10"
            ),
            list(# ignore also because it is infinitely long
              domain="2.5+", 
              factors="Smoking",
              interpolationPolynomial="1.04+0.234*x0^1",
              minValue="1",
              maxValue="10"
            )
          )
        )
      )
    )
  )
)

test_dat1_expected_output=list(
  OldAge=list(
    RiskFactorGroups=list(
      list(
        riskRatioTables=list(
          riskFactorNames=c("Smoking"),
          interpolationTable=list(
            list( 
              domain="0,2.5",
              factors="Smoking",
              interpolationPolynomial="1+0.5*x0^2+-1.234*x0^1",
              interpolationMinimums=list(
                global="1.234"
              ),
              minValue="1",
              maxValue="10"
            ),
            list(
              domain="-4,0",
              factors="Smoking",
              interpolationPolynomial="1+-0.4*x0^1",
              interpolationMinimums=list(
                global="1.234"
              ),
              minValue="1",
              maxValue="10"
            ),
            list( 
              domain=",-4",
              factors="Smoking",
              interpolationPolynomial="1+-0.4*x0^1",
              interpolationMinimums=list(
                global="1.234"
              ),
              minValue="1",
              maxValue="10"
            ),
            list(
              domain="2.5", 
              factors="Smoking",
              interpolationPolynomial="1.04",
              interpolationMinimums=list(
                global="1.234"
              ),
              minValue="1",
              maxValue="10"
            ),
            list(
              domain="2.5+", 
              factors="Smoking",
              interpolationPolynomial="1.04+0.234*x0^1",
              interpolationMinimums=list(
                global="1.234"
              ),
              minValue="1",
              maxValue="10"
            )
          )
        )
      )
    )
  )
)
