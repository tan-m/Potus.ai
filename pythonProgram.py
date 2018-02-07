import sys
import operator
import rdflib
import csv

import sys
reload(sys)
sys.setdefaultencoding('utf8')


#Function to remove prospective intents with unwanted data
def containsUnwantedData(intent):
    if ("#" in intent) or ("label" in intent) or ("comment" in intent) or ("wiki" in intent) or ("wordnet" in intent) or ("rdf" in intent):
        return True
    return False

#Parsing the RDF file of the given historical personality
if sys.argv[1] == "":
    print("<ERROR> Personality name not entered")
    exit()
data = rdflib.Graph()
data.parse("http://dbpedia.org/data/" + sys.argv[1].title().replace(" ","_") + ".rdf")
if not data:
    print("<ERROR> Historic personality does not exist ")
    exit()
historicalPersonalityName = sys.argv[1].title().replace("_"," ") #<Legacy Utility Code> To extract name for URL, this line was handy: historicalPersonalityName = sys.argv[1].rsplit('/',1)[-1].rsplit('.')[0].replace("_", " ")
textData = [[0 for x in range(3)] for y in range(len(data))]

#Storing the tuples from RDF graph as lists
i = 0
for subject, predicate, obj in data:
    textData[i][0] = subject.rsplit('/', 1)[-1].replace("_", " ")
    textData[i][1] = predicate.rsplit('/', 1)[-1].replace("_", " ")
    textData[i][2] = obj.rsplit('/', 1)[-1].replace("_", " ")
    i = i + 1
i = 0

#Sorting the data on the basis of subject and predicate columns
sortedTextData = sorted(textData, key = operator.itemgetter(0, 1))#lambda x:x[1])

fileWriter = csv.writer(open(historicalPersonalityName.replace(" ","_") + ".csv","w"), delimiter=',', quoting=csv.QUOTE_ALL)
#dataToWrite = [0 for x in range(2)]
dataToWrite = [sortedTextData[0][1], sortedTextData[0][2]]
numberOfBirthdates = 0;

#Checking number of birthdates
for subject, predicate, obj in sortedTextData:
    if predicate == "birthDate":
        numberOfBirthdates = numberOfBirthdates + 1
skipFlag = True

#Preprocess data to remove unwanted data and writing stored data in lists to a CSV file named as the historical figure
#print(historicalPersonalityName)
intentInConsideration = sortedTextData[0][2]
for subject, predicate, obj in sortedTextData:
   # print(subject, "||||", predicate, ">>>>", obj)  #if subject == historicalPersonalityName:
   if subject == historicalPersonalityName:
       if containsUnwantedData(predicate) == True:
           continue
       if skipFlag == True: #To skip spurious birth dates
           if predicate == "birthDate" and numberOfBirthdates > 1:
               skipFlag = False
               continue
       #dataToWrite[0] = subject
       if intentInConsideration == predicate:
           dataToWrite.append(obj)
       else:
           fileWriter.writerow(dataToWrite)
           dataToWrite = [predicate, obj]
           intentInConsideration = predicate
print("<SUCCESS> Preprocessed Data stored in \"" + historicalPersonalityName.replace(" ","_") + ".csv\" ")
