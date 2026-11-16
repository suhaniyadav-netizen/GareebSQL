import unittest
import json
from app import create_app

class TestGareebSQLAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_health_check(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['status'], 'healthy')

    def test_get_branches(self):
        response = self.client.get('/api/branches')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)

    def test_get_customers(self):
        response = self.client.get('/api/customers')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)

    def test_get_accounts(self):
        response = self.client.get('/api/accounts')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)

    def test_get_transactions(self):
        response = self.client.get('/api/transactions')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)

    def test_get_loans(self):
        response = self.client.get('/api/loans')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)

    def test_analytics_summary(self):
        response = self.client.get('/api/analytics/summary')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('customers', data['data'])
        self.assertIn('accounts', data['data'])
        self.assertIn('loans', data['data'])

    def test_analytics_customer_balances(self):
        response = self.client.get('/api/analytics/customer-balances')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])

    def test_analytics_monthly_activity(self):
        response = self.client.get('/api/analytics/monthly-activity')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])

    def test_analytics_set_operations(self):
        response = self.client.get('/api/analytics/set-operations')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])

    def test_account_statement(self):
        response = self.client.get('/api/transactions/statement/100100001001')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])

if __name__ == '__main__':
    unittest.main()
