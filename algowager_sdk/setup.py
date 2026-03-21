from setuptools import setup, find_packages

setup(
    name="algowager-sdk",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "requests",
        "py-algorand-sdk"
    ],
    author="AlgoWager Team",
    description="Anti-hallucination SDK for verified Algorand trading agents",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)
