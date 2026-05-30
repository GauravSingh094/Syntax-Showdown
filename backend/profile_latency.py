import asyncio
import time
import sys
import os

sys.path.append(r'c:\Users\singh\OneDrive\Desktop\debate\backend')

from app.agents.side_agent import SideAgent
from app.agents.pro_agent import ProAgent

async def profile():
    topic = "All doctors should be completely replaced by AI systems in healthcare."
    
    print(f"--- Profiling Topic: {topic} ---")
    
    start = time.time()
    side_agent = SideAgent()
    sides = await side_agent.get_sides(topic)
    print(f"SideAgent took: {time.time() - start:.2f}s")
    print(f"Sides: {sides}")
    
    start = time.time()
    pro = ProAgent()
    res = await pro.respond(topic, [])
    print(f"ProAgent Turn 1 took: {time.time() - start:.2f}s")
    
if __name__ == "__main__":
    asyncio.run(profile())
