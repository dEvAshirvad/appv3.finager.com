"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/api";

// Types
export type AccountType =
	| "asset"
	| "liability"
	| "equity"
	| "income"
	| "expense";

export interface AccountBalance {
	accountId: string;
	accountCode: string;
	accountName: string;
	accountType: AccountType;
	balance: number;
	parentCode?: string | null;
	children?: AccountBalance[]; // Hierarchical tree structure
}

export interface ProfitAndLossPeriod {
	from: string;
	to: string;
}

export interface ProfitAndLossRevenue {
	accounts: AccountBalance[];
	total: number;
}

export interface ProfitAndLossExpenses {
	accounts: AccountBalance[];
	total: number;
}

export interface ProfitAndLossReport {
	period: ProfitAndLossPeriod;
	revenue: ProfitAndLossRevenue;
	expenses: ProfitAndLossExpenses;
	netIncome: number;
	grossProfit?: number;
	operatingExpenses?: number;
	operatingIncome?: number;
}

export interface BalanceSheetAssets {
	accounts: AccountBalance[];
	total: number;
}

export interface BalanceSheetLiabilities {
	accounts: AccountBalance[];
	total: number;
}

export interface BalanceSheetEquity {
	accounts: AccountBalance[];
	total: number;
}

export interface BalanceSheetReport {
	asOf: string;
	assets: BalanceSheetAssets;
	liabilities: BalanceSheetLiabilities;
	equity: BalanceSheetEquity;
	totalLiabilitiesAndEquity: number;
	isBalanced: boolean;
	difference?: number;
}

export interface NetIncomePeriod {
	from: string;
	to: string;
}

export interface NetIncomeReport {
	period: NetIncomePeriod;
	netIncome: number;
	revenue: number;
	expenses: number;
}

export interface TrialBalanceAccount {
	accountId: string;
	accountCode: string;
	accountName: string;
	accountType: AccountType;
	debitBalance: number;
	creditBalance: number;
}

export interface TrialBalanceReport {
	asOf: string;
	accounts: TrialBalanceAccount[];
	totalDebits: number;
	totalCredits: number;
	isBalanced: boolean;
	difference?: number;
}

export interface CashFlowPeriod {
	from: string;
	to: string;
}

export interface CashFlowItem {
	accountId: string;
	accountCode: string;
	accountName: string;
	accountType: string;
	amount: number; // Positive for inflow, negative for outflow
	description?: string;
	date: string;
	reference?: string;
}

export interface CashFlowActivities {
	items: CashFlowItem[];
	total: number;
}

export interface CashFlowReport {
	period: CashFlowPeriod;
	openingCashBalance: number;
	operatingActivities: CashFlowActivities;
	investingActivities: CashFlowActivities;
	financingActivities: CashFlowActivities;
	netCashFlow: number;
	closingCashBalance: number;
}

// Request Types
export interface ProfitAndLossRequest {
	fromDate: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
	toDate: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
	organizationId?: string;
}

export interface BalanceSheetRequest {
	asOfDate?: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ (optional, defaults to current date)
	organizationId?: string;
}

export interface NetIncomeRequest {
	fromDate: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
	toDate: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
	organizationId?: string;
}

export interface TrialBalanceRequest {
	asOfDate?: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ (optional, defaults to current date)
	organizationId?: string;
}

export interface CashFlowRequest {
	fromDate: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
	toDate: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
	organizationId?: string;
}

// Response Types
export interface ProfitAndLossResponse {
	message: string;
	data: ProfitAndLossReport;
}

export interface BalanceSheetResponse {
	message: string;
	data: BalanceSheetReport;
}

export interface NetIncomeResponse {
	message: string;
	data: NetIncomeReport;
}

export interface TrialBalanceResponse {
	message: string;
	data: TrialBalanceReport;
}

export interface CashFlowResponse {
	message: string;
	data: CashFlowReport;
}

// Query Keys
export const reportsKeys = {
	all: ["reports"] as const,
	profitAndLoss: (params: ProfitAndLossRequest) =>
		[...reportsKeys.all, "profit-and-loss", params] as const,
	balanceSheet: (params: BalanceSheetRequest) =>
		[...reportsKeys.all, "balance-sheet", params] as const,
	netIncome: (params: NetIncomeRequest) =>
		[...reportsKeys.all, "net-income", params] as const,
	trialBalance: (params: TrialBalanceRequest) =>
		[...reportsKeys.all, "trial-balance", params] as const,
	cashFlow: (params: CashFlowRequest) =>
		[...reportsKeys.all, "cash-flow", params] as const,
};

// API Functions
async function getProfitAndLoss(
	params: ProfitAndLossRequest
): Promise<ProfitAndLossResponse> {
	const response = await api.get("/v1/accounting/reports/profit-and-loss", {
		params: {
			fromDate: params.fromDate,
			toDate: params.toDate,
			organizationId: params.organizationId,
		},
	});
	return response.data;
}

async function getBalanceSheet(
	params: BalanceSheetRequest
): Promise<BalanceSheetResponse> {
	const response = await api.get("/v1/accounting/reports/balance-sheet", {
		params: {
			asOfDate: params.asOfDate,
			organizationId: params.organizationId,
		},
	});
	return response.data;
}

async function getNetIncome(
	params: NetIncomeRequest
): Promise<NetIncomeResponse> {
	const response = await api.get("/v1/accounting/reports/net-income", {
		params: {
			fromDate: params.fromDate,
			toDate: params.toDate,
			organizationId: params.organizationId,
		},
	});
	return response.data;
}

async function getTrialBalance(
	params: TrialBalanceRequest
): Promise<TrialBalanceResponse> {
	const response = await api.get("/v1/accounting/reports/trial-balance", {
		params: {
			asOfDate: params.asOfDate,
			organizationId: params.organizationId,
		},
	});
	return response.data;
}

async function getCashFlow(params: CashFlowRequest): Promise<CashFlowResponse> {
	const response = await api.get("/v1/accounting/reports/cash-flow", {
		params: {
			fromDate: params.fromDate,
			toDate: params.toDate,
			organizationId: params.organizationId,
		},
	});
	return response.data;
}

// React Query Hooks
export function useProfitAndLoss(params?: ProfitAndLossRequest) {
	return useQuery({
		queryKey: reportsKeys.profitAndLoss(params || { fromDate: "", toDate: "" }),
		queryFn: () => getProfitAndLoss(params!),
		enabled: !!params && !!params.fromDate && !!params.toDate,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useBalanceSheet(params?: BalanceSheetRequest) {
	return useQuery({
		queryKey: reportsKeys.balanceSheet(params || {}),
		queryFn: () => getBalanceSheet(params || {}),
		enabled: true, // asOfDate is optional, so query can run without params
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useNetIncome(params?: NetIncomeRequest) {
	return useQuery({
		queryKey: reportsKeys.netIncome(params || { fromDate: "", toDate: "" }),
		queryFn: () => getNetIncome(params!),
		enabled: !!params && !!params.fromDate && !!params.toDate,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useTrialBalance(params?: TrialBalanceRequest) {
	return useQuery({
		queryKey: reportsKeys.trialBalance(params || {}),
		queryFn: () => getTrialBalance(params || {}),
		enabled: true, // asOfDate is optional, so query can run without params
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function useCashFlow(params?: CashFlowRequest) {
	return useQuery({
		queryKey: reportsKeys.cashFlow(params || { fromDate: "", toDate: "" }),
		queryFn: () => getCashFlow(params!),
		enabled: !!params && !!params.fromDate && !!params.toDate,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}
