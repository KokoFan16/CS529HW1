This is my solution for CS529 homework1.

I modified the color map to utilize a linear blue scale (from light blue to deep blue). This is colorblind-friendly because people can detect differences in brightness and saturation even if they cannot distinguish the blue colors. 
The number of deaths was then normalized by state population for both the map and the stacked-bar chart.
I used the circle area to map the number of deaths for city makers, and I adjusted the color and opacity to clearly show them.
I plotted the stacked-bar chart to show a more truthful or insightful representation of the dataset, and it supports a gender-based (male and female) analysis of the data.
The tooltips for both states (modified tooltips) and cities (add new tooltips) display rich information such as male and female deaths, total deaths, population, and the normalized deaths by population.

I linked the map and stacked-bar chart with the brushing behavior, highlighting the same data chunk (the highlighted one (for both map and statcked-bar chart) has a higher opacity and border boundary). 
I also added the brushing behavior for the city markers, highlighting the brushed one in dark red. When we click the button to zoom in, this will help us identify which city is showing.

For an extra point, I found the open-sourced data at https://public.opendatasoft.com/explore/dataset/us-cities-demographics/table/.
I loaded the data (App.js; see lines 18 (lines 51–58) and 65) and filtered the data into a dictionary (with city names as keys and their polulation as values) (see lines 15–20).
But there are some issues with mapping this data to the previous city data.
Due to time constraints, I have not finished this yet.
I will continue to work on that and submit it next time.
