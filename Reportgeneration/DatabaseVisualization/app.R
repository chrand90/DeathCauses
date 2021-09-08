#
# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

library(devtools)
load_all('RRtablePlotting')

library(shiny)
library(ggplot2)
library(gridExtra)

dat=initialize_database(c("../../death-causes-app/src/resources/Causes.json",
                          "../../death-causes-app/src/resources/Conditions.json",
                          "../../death-causes-app/src/resources/CategoryCauses.json"
                          ),
                        "../../death-causes-app/src/resources/Descriptions.json")
all_diseases=dat@diseases
# Define UI for application that draws a histogram

Number_of_plot_slots=20
theight=8000

ui <- fluidPage(
   
   # Application title
   titlePanel("DeathCauses database"),
   
   
   
   selectInput(inputId = "cause", label = NULL, choices=names(all_diseases)),
   plotOutput('distPlot', height=theight)
   
)






# Define server logic required to draw a histogram
server <- function(input, output) {
  
  
  outp <- reactive({all_diseases[[input$cause]]})
    # flattened_risk_table=list()
    # 
    # #age_plot
    # count=0
    # risk_ratio_names=list()
    # risk_ratio_numbers=list()
    # for(riskfactor_group in subdat$RiskFactorGroups){
    #   for(l in riskfactor_group$riskRatioTables){
    #     count=count+1
    #     riskratio_names[[count]] <- l$riskFactorNames
    #     riskratio_numbers[[count]] <- l$riskRatioTable
    #   }
    # }
  
  
   
   output$distPlot <- renderPlot({
      # generate bins based on input$bins from ui.R
     print("printing names of outp")
     print(names(outp()))
     list_of_plots=makePlot(outp(), plotFrequencies = T)
     ln=length(list_of_plots)
     if(ln<Number_of_plot_slots){
       number_of_remaining=Number_of_plot_slots-ln
       extras=replicate(number_of_remaining, ggplot()+theme_void(), simplify = F)
       list_of_plots=c(list_of_plots, extras)
     }
     list_of_plots$ncol=1
      g <- do.call(grid.arrange, list_of_plots)
      return(g)
      
      
      #list_of_plots[[2]] <- htmlOutput()
      #tagList(list_of_plots)
      #return(list_of_plots[[1]])
      
            #bins <- seq(min(x), max(x), length.out = 4 + 1)
      
      # draw the histogram with the specified number of bins
      #hist(x, breaks = bins, col = 'darkgray', border = 'white')
   })
}

# Run the application 
shinyApp(ui = ui, server = server)

