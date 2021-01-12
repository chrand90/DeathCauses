#
# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

source('readJsonAndPlot.R')

library(shiny)


#p <- plot_ly(data=res_df, x=res_df$xval, y=res_df$yval, z=res_df$zval, type="mesh3d" ) %>% add_trace()

#testing
if(F){
  g=dat$Parkinsons$RiskFactorGroups[[4]]$riskRatioTables[[1]]
  riskratio_names=g$riskFactorNames
  riskratio_numbers=g$riskRatioTable
  interpolation_table=g$interpolationTable
  plot_risk_ratio_file(riskratio_numbers, riskratio_names)
}

if(F){
  g=dat$BreastCancer$RiskFactorGroups[[2]]$riskRatioTables[[2]] # oral contraceptive
  riskratio_names=g$riskFactorNames
  interpolationtable=g$interpolationTable
}

if(F){
  g=dat$BreastCancer$RiskFactorGroups[[2]]$riskRatioTables[[1]] #gender
  riskratio_names=g$riskFactorNames
  interpolationtable=g$interpolationTable
}

if(F){
  g=dat$LiverCancer$RiskFactorGroups[[1]]$riskRatioTables[[1]]
  interpolationtable=g$interpolationTable
  riskratio_names=g$riskFactorNames
}


#r=
#print(r)

# Define UI for application that draws a histogram

Number_of_plot_slots=20
theight=8000

ui <- fluidPage(
   
   # Application title
   titlePanel("DeathCauses database"),
   
   
   
   selectInput(inputId = "cause", label = NULL, choices=names(dat)),
   plotOutput('distPlot', height=theight)
   
)





# Define server logic required to draw a histogram
server <- function(input, output) {
  
  
  outp <- reactive({get_info(input$cause)})
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
      
     age_plot=make_age_plot(outp()$y)
     list_of_plots=list(age_plot)
     count=outp()$count
      if(count>0 && T){
        for(i in 1:count){
          r <- plot_risk_ratio_file(riskratio_names = outp()$riskratio_names[[i]],
                                    riskratio_numbers = outp()$riskratio_numbers[[i]])
          list_of_plots=c(list_of_plots,list(r))
          int_table=outp()$interpolationTable[[i]]
          print('int table')
          print(int_table)
          if(length(int_table)>0){
            interpolation_plots=plot_interpolation_file(int_table,
                                                        outp()$riskratio_names[[i]])
            print(paste('length of interpolation plots', length(interpolation_plots)))
            if(length(interpolation_plots)>0){
              list_of_plots=c(list_of_plots, interpolation_plots)
            }
          }
        }
        if(i<count){
          print(outp()$riskratio_names[[i+1]])
        }
        
      }
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

