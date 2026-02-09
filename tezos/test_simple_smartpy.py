import smartpy as sp

@sp.module
def main():
    class SimpleContract(sp.Contract):
        def __init__(self, value):
            self.data.value = value

@sp.add_test()
def test_simple():
    scenario = sp.test_scenario("Simple Test", main)
    c = main.SimpleContract(42)
    scenario += c
    scenario.verify(c.data.value == 42)
