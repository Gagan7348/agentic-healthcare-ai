import asyncio
import httpx
import xml.etree.ElementTree as ET

async def test():
    # Test WHO api
    try:
        url = "https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDim eq 'IND'&$orderby=TimeDim desc&$top=5&$format=json"
        w = await httpx.AsyncClient().get(url, timeout=10)
        print('WHO endpoint direct:', w.status_code)
    except Exception as e:
        print('WHO Error:', e)
        
    try:
        m = await httpx.AsyncClient().get('https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=diabetes&retmax=3', timeout=10)
        root = ET.fromstring(m.text)
        print('Found documents:', len(root.findall('.//document')))
        for doc in root.findall('.//document'):
            title_el = doc.find("content[@name='title']")
            summary_el = doc.find("content[@name='FullSummary']")
            print('Title:', title_el.text if title_el is not None else 'None')
            print('Summary text length:', len(summary_el.text) if summary_el is not None and summary_el.text else 0)
    except Exception as e:
        print('Medline Error:', e)

asyncio.run(test())
