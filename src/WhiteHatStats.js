import React, {useEffect, useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

    const margin = 50;
    // const radius = 10;

    function cleanString(string){
        return string.replace(' ','_').replace(' ','_');
    }


    //TODO: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
    //this loop updates when the props.data changes or the window resizes
    //we can edit it to also use props.brushedState if you want to use linking
    const chartSelection = useMemo(()=>{
        //wait until the data loads
        if(svg === undefined | props.data === undefined){ return }

        //aggregate gun deaths by state
        const data = props.data.states;

        // Get min and max gun deaths by state 

        //get data for each state
        const plotData = [];
        for(let state of data){
            let entry = {
                'ab': state.abreviation,
                'name': state.state,
                'population': state.population,
                'count': state.count,
                'maleCount': state.male_count,
                'femaleCount': state.count - state.male_count,
                'ratio': state.count / state.population * 100000,
                'male': state.male_count / state.population * 100000,
                'female': (state.count - state.male_count) / state.population * 100000,
            }
            plotData.push(entry)
        }

        const ratiomap = d => d.ratio;
        const stateRatios = Object.values(plotData).map(ratiomap);
        const [ratioMin,ratioMax] = d3.extent(stateRatios);

        // get abreviations (for x axis)
        var groups = d3.map(data, function(d){return(d.abreviation)})

        // set x axis
        var xScale = d3.scaleBand()
                  .domain(groups)
                  .range([0, width - margin])
                  .padding([0.3])
        
        // position of x axis
        svg.append("g")
           .attr("transform", "translate(" + margin + ", " + (height - margin) + ")")
           .call(d3.axisBottom(xScale).tickSizeOuter(0));

        // set y axis
        let yScale = d3.scaleLinear()
                       .domain([ratioMax, 0])
                       .range([margin, height - margin]);
        
        // position of y axis
        svg.append("g")
           .attr("transform", "translate(" + margin + ", " + 0 + ")")
           .call(d3.axisLeft(yScale));

        var barkeys = ['male', 'female'];

        // color map
        var color = d3.scaleOrdinal()
                      .domain(barkeys)
                      .range(['#08519c','#a3baff'])

        // create stack data
        var stackedData = d3.stack()
                            .keys(barkeys)
                            (plotData)

        // draw stack chart
        let chartGroup = svg.append("g")
                            .attr('class','stack')
                            .attr("transform", "translate(" + margin + ", " + 0 + ")");
        
        chartGroup.selectAll("g")
           .data(stackedData)
           .enter().append("g")
           .attr("fill", function(d) { return color(d.key); })
           .selectAll("rect")
           .attr('class','stack-rect')
           .data(function(d) { return d; })
           .enter().append("rect")
           .attr('class','stack-rect')
           .attr('id',d=> cleanString(d.data.name))
           .attr("x", function(d) { return xScale(d.data.ab); })
           .attr("y", function(d) { return yScale(d[1]); })
           .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
           .attr("width", xScale.bandwidth())
           .attr('stroke','black')
           .attr('stroke-width',.1)
           .on('mouseover',(e,d)=>{
                let state = cleanString(d.data.name);
                //this updates the brushed state
                if(props.brushedState !== state){
                    props.setBrushedState(state);
                }
                var ratios, deaths;
                if (d[0] == 0) { 
                    ratios = 'Male-Ratio: ' + d.data.male; 
                    deaths = 'Male-Deaths: ' + d.data.maleCount;
                }
                else { 
                    ratios = 'Female-Ratio: ' + d.data.female;
                    deaths = 'Female-Deaths: ' + d.data.femaleCount;
                }
                let string = d.data.name + '</br>'
                    + '</br>'
                    + ratios + '</br>'
                    + deaths + '</br>'
                    + 'Total-Deatchs: ' + d.data.count + '</br>'
                    + 'Population: ' + d.data.population;
                props.ToolTip.moveTTipEvent(tTip,e)
                tTip.html(string)
            }).on('mousemove',(e)=>{
                props.ToolTip.moveTTipEvent(tTip,e);
            }).on('mouseout',(e,d)=>{
                props.setBrushedState();
                props.ToolTip.hideTTip(tTip);
            });

        // legends group
        var legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width - 3*margin) + ", " + margin + ')' );

        // draw legends
        legend.selectAll('rect')
              .data(barkeys)
              .enter()
              .append('rect')
              .attr('x', 0)
              .attr('y', function(d, i){ return i * 18; })
              .attr('width', 12)
              .attr('height', 12)
              .attr('fill', function(d, i){
                  return color(i);
              });

        // names of legends
        legend.selectAll('text')
              .data(barkeys)
              .enter()
              .append('text')
              .text(function(d){ return d[0].toUpperCase() + d.slice(1) + "-Deaths"; })
              .attr('x', 18)
              .attr('y', function(d, i){ return i * 18;})
              .attr('text-anchor', 'start')
              .attr('alignment-baseline', 'hanging');

        // lable of x axis
        svg.append("text")
           .attr("class", "x-label")
           .attr("x", width/2)
           .attr("y", height - margin/4)
           .attr("text-anchor", "middle")
           .text("State (abreviation)")

        // lable of y axis
        svg.append("text")
           .attr("class", "y-label")
           .attr("text-anchor", "middle")
           .attr("x", -height/2)
           .attr("y", 0)
           .attr("dy", ".75em")
           .attr("transform", "rotate(-90)")
           .text("Gun deaths 100,000 Population");

    //     //get transforms for each value into x and y coordinates
    //     let xScale = d3.scaleLinear()
    //         .domain(d3.extent(plotData,d=>d.easeOfDrawing))
    //         .range([margin+radius,width-margin-radius]);
    //     let yScale = d3.scaleLinear()
    //         .domain(d3.extent(plotData,d=>d.count))
    //         .range([height-margin-radius,margin+radius]);


    //     //draw a line showing the mean values across the curve
    //     //this probably isn't actually regression
    //     const regressionLine = [];
    //     for(let i = 0; i <= 10; i+= 1){
    //         let pvals = plotData.filter(d => Math.abs(d.easeOfDrawing - i) <= .5);
    //         let meanY = 0;
    //         if(pvals.length > 0){
    //             for(let entry of pvals){
    //                 meanY += entry.count/pvals.length
    //             }
    //         }
    //         let point = [xScale(i),yScale(meanY)]
    //         regressionLine.push(point)
    //     }
        
    //     //scale color by gender ratio for no reason
    //     let colorScale = d3.scaleDiverging()
    //         .domain([0,.5,1])
    //         .range(['magenta','white','navy']);

    //     //draw the circles for each state
    //     svg.selectAll('.dot').remove();
    //     svg.selectAll('.dot').data(plotData)
    //         .enter().append('circle')
    //         .attr('cy',d=> yScale(d.count))
    //         .attr('cx',d=>xScale(d.easeOfDrawing))
    //         .attr('fill',d=> colorScale(d.genderRatio))
    //         .attr('r',10)
    //         .on('mouseover',(e,d)=>{
    //             let string = d.name + '</br>'
    //                 + 'Gun Deaths: ' + d.count + '</br>'
    //                 + 'Difficulty Drawing: ' + d.easeOfDrawing;
    //             props.ToolTip.moveTTipEvent(tTip,e)
    //             tTip.html(string)
    //         }).on('mousemove',(e)=>{
    //             props.ToolTip.moveTTipEvent(tTip,e);
    //         }).on('mouseout',(e,d)=>{
    //             props.ToolTip.hideTTip(tTip);
    //         });
           
    //     //draw the line
    //     svg.selectAll('.regressionLine').remove();
    //     svg.append('path').attr('class','regressionLine')
    //         .attr('d',d3.line().curve(d3.curveBasis)(regressionLine))
    //         .attr('stroke-width',5)
    //         .attr('stroke','black')
    //         .attr('fill','none');

        // change the title
        const labelSize = margin/2;
        svg.append('text')
            .attr('x',width/2)
            .attr('y',labelSize)
            .attr('text-anchor','middle')
            .attr('font-size',labelSize)
            .attr('font-weight','bold')
            .text('Gun Deaths per 100,000 Population by State');

    //     //change the disclaimer here
    //     svg.append('text')
    //         .attr('x',width-20)
    //         .attr('y',height/3)
    //         .attr('text-anchor','end')
    //         .attr('font-size',10)
    //         .text("I'm just asking questions");

    //     //draw basic axes using the x and y scales
    //     svg.selectAll('g').remove()
    //     svg.append('g')
    //         .attr('transform',`translate(0,${height-margin+1})`)
    //         .call(d3.axisBottom(xScale))

    //     svg.append('g')
    //         .attr('transform',`translate(${margin-2},0)`)
    //         .call(d3.axisLeft(yScale))

        return chartGroup;
        
    },[props.data,svg]);

    useMemo(()=>{
        if(chartSelection !== undefined){
            const isBrushed = props.brushedState !== undefined;
            chartSelection.selectAll('.stack-rect')
                          .attr('opacity',isBrushed? 0.2:0.5);
            if(isBrushed){
                chartSelection.select('#'+props.brushedState)
                    .attr('opacity',1);
            }
        }
    },[chartSelection,props.brushedState]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
//END of TODO #1.

 
// const drawingDifficulty = {
//     'IL': 9,
//     'AL': 2,
//     'AK': 1,
//     'AR': 3,
//     'CA': 9.51,
//     'CO': 0,
//     'DE': 3.1,
//     'DC': 1.3,
//     'FL': 8.9,
//     'GA': 3.9,
//     'HI': 4.5,
//     'ID': 4,
//     'IN': 4.3,
//     'IA': 4.1,
//     'KS': 1.6,
//     'KY': 7,
//     'LA': 6.5,
//     'MN': 2.1,
//     'MO': 5.5,
//     'ME': 7.44,
//     'MD': 10,
//     'MA': 6.8,
//     'MI': 9.7,
//     'MN': 5.1,
//     'MS': 3.8,
//     'MT': 1.4,
//     'NE': 1.9,
//     'NV': .5,
//     'NH': 3.7,
//     'NJ': 9.1,
//     'NM': .2,
//     'NY': 8.7,
//     'NC': 8.5,
//     'ND': 2.3,
//     'OH': 5.8,
//     'OK': 6.05,
//     'OR': 4.7,
//     'PA': 4.01,
//     'RI': 8.4,
//     'SC': 7.1,
//     'SD': .9,
//     'TN': 3.333333,
//     'TX': 8.1,
//     'UT': 2.8,
//     'VT': 2.6,
//     'VA': 8.2,
//     'WA': 9.2,
//     'WV': 7.9,
//     'WY': 0,
// }
