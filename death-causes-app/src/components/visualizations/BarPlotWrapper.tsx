import React, { useEffect, useRef, useState } from "react";
import { SurvivalCurveData } from "../Calculations/SurvivalCurveData";
import { BarPlot } from "./BarPlot";

interface BarPlotWrapperProps {
  data: SurvivalCurveData[];
}

const BarPlotWrapper = (props: BarPlotWrapperProps) => {
  const chartArea = useRef(null);
  const [chart, setChart] = useState<BarPlot | null>(null);
  const { width } = useWindowSize();

  const createNewChart = function () {
      setChart(new BarPlot(chartArea.current, props.data));
  };

  useEffect(() => {
    console.log("width changed");
    if (chart) {
      chart.clear();
      createNewChart();
    }
  }, [width]);

  useEffect(() => {
    console.log("dataset changed");
    if (chart) {
      chart.updateChart(props.data);
    }
  }, [props.data]);

  useEffect(() => {
    createNewChart();
    return () => {
      chart?.clear();
    };
  }, []);

  return <svg ref={chartArea} />;
};

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
  });

  let resize_graphic = true;
  function changeWindowSize() {
    if (resize_graphic) {
      resize_graphic = false;
      setTimeout(() => {
        setWindowSize({ width: window.innerWidth });
        resize_graphic = true;
      }, 400);
    }
  }

  useEffect(() => {
    window.addEventListener("resize", changeWindowSize);

    return () => {
      window.removeEventListener("resize", changeWindowSize);
    };
  }, []);

  return windowSize;
}
export default BarPlotWrapper;
