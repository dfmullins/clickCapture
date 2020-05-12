# clickCapture

To demo clickCapture, go here: http://www.damionmullins.com/projects/clickCapture

clickCapture is a front-end error-log and user application-usage report generator

Simply add the clickCapture.js file to your application and have it load on the pages that you would like to track. clickCapture will log any JavaScript errors that occur during a user's session. It will also save each click that the user performs in the application in consecutive order. This data is saved within a data store in the user's browser. At any time, the user can generate a report of their usage and/or any errors produced by the application. The user can then provide the report to a support person in order to better assist the user in their issues, and identify and troubleshoot bugs with greater accuracy.
Although clickCapture can be used on any type of web-application running Jquery, it is especially useful for test environments and/or production environments on database-driven applications that cater to tech-supported logged-in users. For example, if a user is having issues or finds a bug, support can ask the user to initiate clickCapture, in order to see the steps needed to reproduce the issue.

clickCapture creates a log that shows what pages the user went to; what JavaScript errors were thrown, if any; and what elements were clicked up until initiating clickCapture.

clickCapture has multiple configurations:

1. Render a modal window (i.e. same as in this website)
2. Return a string of the data if you would like to save it in a database
3. Download a text file of the data
4. Render the data on a new page/tab
5. Initiate clickCapture using a button instead of typing a keyword
6. Change the "clickCapture" initiate word to anything else

Likewise, you can update the source code in order to make it fit with your application, such as changing the colors of the log, adding your application's logo, capturing other elements, and excluding specific elements.
