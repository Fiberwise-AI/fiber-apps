"""
Analyze Pipeline Performance Function

Comprehensive performance analysis for pipeline executions including timing analysis,
bottleneck identification, resource utilization, and optimization recommendations.
"""

import json
import logging
import statistics
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)

class PipelinePerformanceAnalyzer:
    """
    Analyzes pipeline performance data to identify bottlenecks,
    optimization opportunities, and generate actionable recommendations.
    """
    
    def __init__(self):
        self.function_id = "analyzePipelinePerformance"
        self.version = "1.0.0"
        
        # Performance thresholds and benchmarks
        self.thresholds = {
            'response_time': {
                'excellent': 100,    # < 100ms
                'good': 500,         # < 500ms
                'acceptable': 2000,  # < 2s
                'poor': 10000        # < 10s
            },
            'throughput': {
                'high': 1000,        # > 1000 req/min
                'medium': 100,       # > 100 req/min
                'low': 10           # > 10 req/min
            },
            'error_rate': {
                'excellent': 0.001,  # < 0.1%
                'good': 0.01,        # < 1%
                'acceptable': 0.05,  # < 5%
                'poor': 0.1         # < 10%
            },
            'resource_usage': {
                'cpu': {'normal': 70, 'high': 85, 'critical': 95},
                'memory': {'normal': 80, 'high': 90, 'critical': 95},
                'disk': {'normal': 80, 'high': 90, 'critical': 95}
            }
        }
        
        # Analysis patterns and recommendations
        self.optimization_patterns = {
            'high_latency': {
                'indicators': ['avg_response_time > 2000', 'p95_response_time > 5000'],
                'recommendations': [
                    'Consider implementing caching mechanisms',
                    'Optimize database queries and indexing',
                    'Review algorithm complexity in processing nodes',
                    'Implement connection pooling for external services'
                ]
            },
            'high_error_rate': {
                'indicators': ['error_rate > 0.05', 'timeout_rate > 0.02'],
                'recommendations': [
                    'Implement circuit breaker patterns',
                    'Add retry mechanisms with exponential backoff',
                    'Improve input validation and error handling',
                    'Monitor and optimize external service dependencies'
                ]
            },
            'resource_bottleneck': {
                'indicators': ['cpu_usage > 85', 'memory_usage > 90'],
                'recommendations': [
                    'Scale horizontally by adding more instances',
                    'Optimize memory usage and garbage collection',
                    'Implement asynchronous processing where possible',
                    'Consider upgrading instance types or resources'
                ]
            },
            'inefficient_scaling': {
                'indicators': ['throughput_variance > 0.5', 'inconsistent_performance'],
                'recommendations': [
                    'Implement auto-scaling policies',
                    'Optimize load balancing configuration',
                    'Review resource allocation and limits',
                    'Consider implementing queue-based processing'
                ]
            }
        }
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main execution function for performance analysis.
        
        Args:
            input_data: Execution logs and analysis parameters
            context: Pipeline execution context
            
        Returns:
            Comprehensive performance analysis results
        """
        try:
            # Extract parameters
            execution_logs = input_data.get('execution_logs', [])
            analysis_type = input_data.get('analysis_type', 'timing')
            time_window = input_data.get('time_window', '1h')
            
            logger.info(f"Analyzing {len(execution_logs)} execution logs for {analysis_type} analysis")
            
            if not execution_logs:
                raise ValueError("No execution logs provided for analysis")
            
            # Filter logs by time window if specified
            filtered_logs = await self._filter_logs_by_time_window(execution_logs, time_window)
            
            # Perform analysis based on type
            if analysis_type == 'timing':
                analysis_result = await self._analyze_timing(filtered_logs)
            elif analysis_type == 'throughput':
                analysis_result = await self._analyze_throughput(filtered_logs)
            elif analysis_type == 'error_analysis':
                analysis_result = await self._analyze_errors(filtered_logs)
            elif analysis_type == 'resource_usage':
                analysis_result = await self._analyze_resource_usage(filtered_logs)
            else:
                # Comprehensive analysis (default)
                analysis_result = await self._comprehensive_analysis(filtered_logs)
            
            # Generate optimization recommendations
            recommendations = await self._generate_recommendations(analysis_result, filtered_logs)
            
            # Generate performance charts data
            charts_data = await self._generate_charts_data(filtered_logs, analysis_type)
            
            # Build complete result
            result = {
                'output': {
                    'performance_summary': analysis_result,
                    'bottlenecks': await self._identify_bottlenecks(analysis_result),
                    'recommendations': recommendations,
                    'charts_data': charts_data,
                    'analysis_metadata': {
                        'logs_analyzed': len(filtered_logs),
                        'time_window': time_window,
                        'analysis_type': analysis_type,
                        'analysis_timestamp': datetime.utcnow().isoformat(),
                        'trends': await self._analyze_trends(filtered_logs)
                    },
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat()
                    }
                },
                'status': 'completed'
            }
            
            logger.info(f"Performance analysis completed for {len(filtered_logs)} logs")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing pipeline performance: {str(e)}", exc_info=True)
            return {
                'output': {
                    'performance_summary': {},
                    'bottlenecks': [],
                    'recommendations': [],
                    'charts_data': {},
                    'error': str(e),
                    'function_metadata': {
                        'function_id': self.function_id,
                        'version': self.version,
                        'execution_timestamp': datetime.utcnow().isoformat(),
                        'error_occurred': True
                    }
                },
                'status': 'failed',
                'error': str(e)
            }
    
    async def _filter_logs_by_time_window(self, logs: List[Dict[str, Any]], time_window: str) -> List[Dict[str, Any]]:
        """Filter execution logs by time window"""
        
        if not time_window or time_window == 'all':
            return logs
        
        try:
            # Parse time window (e.g., "1h", "1d", "1w")
            unit = time_window[-1].lower()
            value = int(time_window[:-1])
            
            if unit == 'h':
                delta = timedelta(hours=value)
            elif unit == 'd':
                delta = timedelta(days=value)
            elif unit == 'w':
                delta = timedelta(weeks=value)
            elif unit == 'm':
                delta = timedelta(minutes=value)
            else:
                logger.warning(f"Unknown time window unit: {unit}, using all logs")
                return logs
            
            cutoff_time = datetime.utcnow() - delta
            
            filtered = []
            for log in logs:
                log_time_str = log.get('started_at') or log.get('timestamp') or log.get('created_at')
                if log_time_str:
                    try:
                        log_time = datetime.fromisoformat(log_time_str.replace('Z', '+00:00'))
                        if log_time >= cutoff_time:
                            filtered.append(log)
                    except ValueError:
                        # Include logs with unparseable timestamps
                        filtered.append(log)
                else:
                    # Include logs without timestamps
                    filtered.append(log)
            
            logger.info(f"Filtered {len(logs)} logs to {len(filtered)} within {time_window}")
            return filtered
            
        except Exception as e:
            logger.warning(f"Error filtering logs by time window: {str(e)}, using all logs")
            return logs
    
    async def _analyze_timing(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze execution timing patterns"""
        
        durations = []
        node_timings = defaultdict(list)
        
        for log in logs:
            # Extract overall execution duration
            duration = log.get('duration_ms')
            if duration is not None:
                durations.append(duration)
            
            # Extract node-level timings
            node_results = log.get('node_results', {})
            if isinstance(node_results, dict):
                for node_id, node_data in node_results.items():
                    if isinstance(node_data, dict):
                        node_duration = node_data.get('duration_ms')
                        if node_duration is not None:
                            node_timings[node_id].append(node_duration)
        
        if not durations:
            return {'error': 'No timing data available'}
        
        # Calculate timing statistics
        timing_stats = {
            'overall_timing': {
                'mean_ms': round(statistics.mean(durations), 2),
                'median_ms': round(statistics.median(durations), 2),
                'std_dev_ms': round(statistics.stdev(durations) if len(durations) > 1 else 0, 2),
                'min_ms': min(durations),
                'max_ms': max(durations),
                'p95_ms': round(self._percentile(durations, 95), 2),
                'p99_ms': round(self._percentile(durations, 99), 2),
                'total_executions': len(durations)
            },
            'node_timing': {}
        }
        
        # Analyze node-level timings
        for node_id, node_durations in node_timings.items():
            if node_durations:
                timing_stats['node_timing'][node_id] = {
                    'mean_ms': round(statistics.mean(node_durations), 2),
                    'median_ms': round(statistics.median(node_durations), 2),
                    'min_ms': min(node_durations),
                    'max_ms': max(node_durations),
                    'executions': len(node_durations),
                    'percentage_of_total': round((statistics.mean(node_durations) / statistics.mean(durations)) * 100, 1)
                }
        
        # Performance classification
        avg_duration = statistics.mean(durations)
        if avg_duration < self.thresholds['response_time']['excellent']:
            performance_rating = 'excellent'
        elif avg_duration < self.thresholds['response_time']['good']:
            performance_rating = 'good'
        elif avg_duration < self.thresholds['response_time']['acceptable']:
            performance_rating = 'acceptable'
        else:
            performance_rating = 'poor'
        
        timing_stats['performance_rating'] = performance_rating
        timing_stats['slowest_nodes'] = sorted(
            [(node_id, data['mean_ms']) for node_id, data in timing_stats['node_timing'].items()],
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return timing_stats
    
    async def _analyze_throughput(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze execution throughput and capacity"""
        
        if not logs:
            return {'error': 'No logs available for throughput analysis'}
        
        # Group executions by time periods
        hourly_counts = defaultdict(int)
        success_counts = defaultdict(int)
        
        for log in logs:
            timestamp_str = log.get('started_at') or log.get('timestamp')
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    hour_key = timestamp.replace(minute=0, second=0, microsecond=0)
                    hourly_counts[hour_key] += 1
                    
                    if log.get('status') == 'completed':
                        success_counts[hour_key] += 1
                except ValueError:
                    continue
        
        if not hourly_counts:
            return {'error': 'No valid timestamps found for throughput analysis'}
        
        # Calculate throughput metrics
        total_executions = sum(hourly_counts.values())
        total_hours = len(hourly_counts)
        
        throughput_data = list(hourly_counts.values())
        success_rates = [
            (success_counts[hour] / count * 100) if count > 0 else 0 
            for hour, count in hourly_counts.items()
        ]
        
        throughput_stats = {
            'average_per_hour': round(total_executions / total_hours, 2) if total_hours > 0 else 0,
            'peak_per_hour': max(throughput_data) if throughput_data else 0,
            'min_per_hour': min(throughput_data) if throughput_data else 0,
            'throughput_variance': round(statistics.variance(throughput_data), 2) if len(throughput_data) > 1 else 0,
            'average_success_rate': round(statistics.mean(success_rates), 1) if success_rates else 0,
            'total_executions': total_executions,
            'time_periods_analyzed': total_hours,
            'capacity_utilization': 'unknown'  # Would need capacity limits to calculate
        }
        
        # Throughput classification
        avg_throughput = throughput_stats['average_per_hour']
        if avg_throughput >= self.thresholds['throughput']['high']:
            throughput_rating = 'high'
        elif avg_throughput >= self.thresholds['throughput']['medium']:
            throughput_rating = 'medium'
        else:
            throughput_rating = 'low'
        
        throughput_stats['throughput_rating'] = throughput_rating
        
        return throughput_stats
    
    async def _analyze_errors(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze error patterns and failure modes"""
        
        total_executions = len(logs)
        if total_executions == 0:
            return {'error': 'No logs available for error analysis'}
        
        # Categorize executions by status
        status_counts = defaultdict(int)
        error_types = defaultdict(int)
        node_errors = defaultdict(int)
        error_messages = defaultdict(int)
        
        for log in logs:
            status = log.get('status', 'unknown')
            status_counts[status] += 1
            
            # Analyze error details
            if status in ['failed', 'error']:
                error_msg = log.get('error', log.get('error_message', 'Unknown error'))
                error_messages[error_msg] += 1
                
                # Extract error type from message
                error_type = self._categorize_error(error_msg)
                error_types[error_type] += 1
                
                # Node-level error analysis
                node_results = log.get('node_results', {})
                if isinstance(node_results, dict):
                    for node_id, node_data in node_results.items():
                        if isinstance(node_data, dict) and node_data.get('status') == 'failed':
                            node_errors[node_id] += 1
        
        # Calculate error metrics
        failed_count = status_counts.get('failed', 0) + status_counts.get('error', 0)
        error_rate = (failed_count / total_executions) * 100
        
        # Error rate classification
        if error_rate <= self.thresholds['error_rate']['excellent'] * 100:
            error_rating = 'excellent'
        elif error_rate <= self.thresholds['error_rate']['good'] * 100:
            error_rating = 'good'
        elif error_rate <= self.thresholds['error_rate']['acceptable'] * 100:
            error_rating = 'acceptable'
        else:
            error_rating = 'poor'
        
        error_stats = {
            'overall_error_rate': round(error_rate, 2),
            'error_rating': error_rating,
            'total_executions': total_executions,
            'failed_executions': failed_count,
            'success_executions': status_counts.get('completed', 0),
            'status_distribution': dict(status_counts),
            'top_error_types': sorted(error_types.items(), key=lambda x: x[1], reverse=True)[:5],
            'top_error_messages': sorted(error_messages.items(), key=lambda x: x[1], reverse=True)[:5],
            'nodes_with_errors': sorted(node_errors.items(), key=lambda x: x[1], reverse=True)[:5]
        }
        
        return error_stats
    
    async def _analyze_resource_usage(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze resource utilization patterns"""
        
        # Extract resource usage data from logs
        cpu_usage = []
        memory_usage = []
        disk_usage = []
        network_io = []
        
        for log in logs:
            resources = log.get('resource_usage', {})
            if isinstance(resources, dict):
                if 'cpu_percent' in resources:
                    cpu_usage.append(resources['cpu_percent'])
                if 'memory_percent' in resources:
                    memory_usage.append(resources['memory_percent'])
                if 'disk_percent' in resources:
                    disk_usage.append(resources['disk_percent'])
                if 'network_io_mb' in resources:
                    network_io.append(resources['network_io_mb'])
        
        # If no resource data, return basic analysis
        if not any([cpu_usage, memory_usage, disk_usage, network_io]):
            return {
                'resource_data_available': False,
                'message': 'No resource usage data found in execution logs',
                'recommendation': 'Enable resource monitoring to get detailed utilization metrics'
            }
        
        resource_stats = {
            'resource_data_available': True,
            'cpu_analysis': self._analyze_resource_metric(cpu_usage, 'cpu') if cpu_usage else None,
            'memory_analysis': self._analyze_resource_metric(memory_usage, 'memory') if memory_usage else None,
            'disk_analysis': self._analyze_resource_metric(disk_usage, 'disk') if disk_usage else None,
            'network_analysis': {
                'avg_io_mb': round(statistics.mean(network_io), 2) if network_io else 0,
                'total_io_mb': round(sum(network_io), 2) if network_io else 0,
                'peak_io_mb': max(network_io) if network_io else 0
            } if network_io else None
        }
        
        # Overall resource health assessment
        resource_alerts = []
        if cpu_usage and statistics.mean(cpu_usage) > self.thresholds['resource_usage']['cpu']['high']:
            resource_alerts.append('High CPU utilization detected')
        if memory_usage and statistics.mean(memory_usage) > self.thresholds['resource_usage']['memory']['high']:
            resource_alerts.append('High memory utilization detected')
        if disk_usage and statistics.mean(disk_usage) > self.thresholds['resource_usage']['disk']['high']:
            resource_alerts.append('High disk utilization detected')
        
        resource_stats['alerts'] = resource_alerts
        resource_stats['overall_health'] = 'critical' if len(resource_alerts) >= 2 else 'warning' if resource_alerts else 'healthy'
        
        return resource_stats
    
    async def _comprehensive_analysis(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform comprehensive analysis combining all metrics"""
        
        timing_analysis = await self._analyze_timing(logs)
        throughput_analysis = await self._analyze_throughput(logs)
        error_analysis = await self._analyze_errors(logs)
        resource_analysis = await self._analyze_resource_usage(logs)
        
        # Overall health score calculation
        scores = []
        
        # Timing score (0-100)
        if 'performance_rating' in timing_analysis:
            rating_scores = {'excellent': 100, 'good': 80, 'acceptable': 60, 'poor': 30}
            scores.append(rating_scores.get(timing_analysis['performance_rating'], 50))
        
        # Error rate score (0-100)
        if 'error_rating' in error_analysis:
            rating_scores = {'excellent': 100, 'good': 80, 'acceptable': 60, 'poor': 30}
            scores.append(rating_scores.get(error_analysis['error_rating'], 50))
        
        # Throughput score (0-100)
        if 'throughput_rating' in throughput_analysis:
            rating_scores = {'high': 100, 'medium': 70, 'low': 40}
            scores.append(rating_scores.get(throughput_analysis['throughput_rating'], 50))
        
        # Resource health score (0-100)
        if resource_analysis.get('resource_data_available'):
            health = resource_analysis.get('overall_health', 'healthy')
            health_scores = {'healthy': 100, 'warning': 60, 'critical': 20}
            scores.append(health_scores.get(health, 50))
        
        overall_health_score = round(statistics.mean(scores), 1) if scores else 50
        
        return {
            'overall_health_score': overall_health_score,
            'timing_analysis': timing_analysis,
            'throughput_analysis': throughput_analysis,
            'error_analysis': error_analysis,
            'resource_analysis': resource_analysis,
            'analysis_summary': {
                'total_logs_analyzed': len(logs),
                'analysis_completeness': len(scores) / 4 * 100,  # Percentage of complete analyses
                'key_insights': await self._generate_key_insights(timing_analysis, throughput_analysis, error_analysis, resource_analysis)
            }
        }
    
    async def _identify_bottlenecks(self, analysis_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify performance bottlenecks from analysis results"""
        
        bottlenecks = []
        
        # Check timing bottlenecks
        timing_analysis = analysis_result.get('timing_analysis', {})
        if timing_analysis.get('performance_rating') in ['poor', 'acceptable']:
            slowest_nodes = timing_analysis.get('slowest_nodes', [])
            for node_id, duration in slowest_nodes[:3]:
                bottlenecks.append({
                    'type': 'timing',
                    'severity': 'high' if duration > 5000 else 'medium',
                    'component': node_id,
                    'metric': f'{duration}ms average duration',
                    'impact': 'High latency affecting overall pipeline performance',
                    'priority': 'high' if duration > 5000 else 'medium'
                })
        
        # Check error bottlenecks
        error_analysis = analysis_result.get('error_analysis', {})
        if error_analysis.get('overall_error_rate', 0) > 5:
            nodes_with_errors = error_analysis.get('nodes_with_errors', [])
            for node_id, error_count in nodes_with_errors[:3]:
                bottlenecks.append({
                    'type': 'reliability',
                    'severity': 'high',
                    'component': node_id,
                    'metric': f'{error_count} failures',
                    'impact': 'High error rate affecting pipeline reliability',
                    'priority': 'high'
                })
        
        # Check resource bottlenecks
        resource_analysis = analysis_result.get('resource_analysis', {})
        if resource_analysis.get('resource_data_available'):
            for resource_type in ['cpu_analysis', 'memory_analysis', 'disk_analysis']:
                resource_data = resource_analysis.get(resource_type)
                if resource_data and resource_data.get('classification') in ['high', 'critical']:
                    bottlenecks.append({
                        'type': 'resource',
                        'severity': 'high' if resource_data['classification'] == 'critical' else 'medium',
                        'component': resource_type.replace('_analysis', '').upper(),
                        'metric': f"{resource_data.get('average', 0)}% utilization",
                        'impact': f'High {resource_type.replace("_analysis", "")} usage limiting performance',
                        'priority': 'high' if resource_data['classification'] == 'critical' else 'medium'
                    })
        
        # Check throughput bottlenecks
        throughput_analysis = analysis_result.get('throughput_analysis', {})
        if throughput_analysis.get('throughput_rating') == 'low':
            bottlenecks.append({
                'type': 'capacity',
                'severity': 'medium',
                'component': 'Overall Pipeline',
                'metric': f"{throughput_analysis.get('average_per_hour', 0)} executions/hour",
                'impact': 'Low throughput may indicate capacity constraints',
                'priority': 'medium'
            })
        
        # Sort by priority and severity
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        bottlenecks.sort(key=lambda x: (priority_order.get(x['priority'], 0), priority_order.get(x['severity'], 0)), reverse=True)
        
        return bottlenecks[:10]  # Return top 10 bottlenecks
    
    async def _generate_recommendations(self, analysis_result: Dict[str, Any], logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate actionable optimization recommendations"""
        
        recommendations = []
        
        # Analyze patterns and generate specific recommendations
        for pattern_name, pattern_config in self.optimization_patterns.items():
            if await self._matches_pattern(analysis_result, pattern_config['indicators']):
                for rec_text in pattern_config['recommendations']:
                    recommendations.append({
                        'category': pattern_name.replace('_', ' ').title(),
                        'recommendation': rec_text,
                        'priority': 'high' if 'critical' in pattern_name else 'medium',
                        'estimated_impact': 'high',
                        'implementation_effort': 'medium'
                    })
        
        # Add specific recommendations based on analysis
        timing_analysis = analysis_result.get('timing_analysis', {})
        if timing_analysis.get('performance_rating') == 'poor':
            recommendations.append({
                'category': 'Performance Optimization',
                'recommendation': 'Implement parallel processing for independent pipeline nodes',
                'priority': 'high',
                'estimated_impact': 'high',
                'implementation_effort': 'high'
            })
        
        error_analysis = analysis_result.get('error_analysis', {})
        if error_analysis.get('overall_error_rate', 0) > 10:
            recommendations.append({
                'category': 'Reliability Improvement',
                'recommendation': 'Implement comprehensive input validation and error recovery mechanisms',
                'priority': 'high',
                'estimated_impact': 'high',
                'implementation_effort': 'medium'
            })
        
        # Remove duplicates and sort by priority
        unique_recommendations = []
        seen_recommendations = set()
        
        for rec in recommendations:
            rec_key = rec['recommendation']
            if rec_key not in seen_recommendations:
                unique_recommendations.append(rec)
                seen_recommendations.add(rec_key)
        
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        unique_recommendations.sort(key=lambda x: priority_order.get(x['priority'], 0), reverse=True)
        
        return unique_recommendations[:10]  # Return top 10 recommendations
    
    async def _generate_charts_data(self, logs: List[Dict[str, Any]], analysis_type: str) -> Dict[str, Any]:
        """Generate data for performance visualization charts"""
        
        charts_data = {}
        
        # Timeline chart data
        timeline_data = []
        for log in logs:
            timestamp_str = log.get('started_at') or log.get('timestamp')
            duration = log.get('duration_ms', 0)
            status = log.get('status', 'unknown')
            
            if timestamp_str:
                timeline_data.append({
                    'timestamp': timestamp_str,
                    'duration': duration,
                    'status': status
                })
        
        charts_data['timeline'] = sorted(timeline_data, key=lambda x: x['timestamp'])
        
        # Performance distribution chart
        durations = [log.get('duration_ms', 0) for log in logs if log.get('duration_ms') is not None]
        if durations:
            # Create histogram bins
            min_duration = min(durations)
            max_duration = max(durations)
            bin_count = min(20, len(durations))  # Up to 20 bins
            
            if max_duration > min_duration:
                bin_size = (max_duration - min_duration) / bin_count
                bins = []
                for i in range(bin_count):
                    bin_start = min_duration + (i * bin_size)
                    bin_end = min_duration + ((i + 1) * bin_size)
                    count = sum(1 for d in durations if bin_start <= d < bin_end)
                    bins.append({
                        'range': f'{int(bin_start)}-{int(bin_end)}ms',
                        'count': count
                    })
                
                charts_data['duration_distribution'] = bins
        
        # Status distribution pie chart
        status_counts = defaultdict(int)
        for log in logs:
            status_counts[log.get('status', 'unknown')] += 1
        
        charts_data['status_distribution'] = [
            {'status': status, 'count': count}
            for status, count in status_counts.items()
        ]
        
        # Node performance comparison
        node_performance = defaultdict(list)
        for log in logs:
            node_results = log.get('node_results', {})
            if isinstance(node_results, dict):
                for node_id, node_data in node_results.items():
                    if isinstance(node_data, dict):
                        duration = node_data.get('duration_ms')
                        if duration is not None:
                            node_performance[node_id].append(duration)
        
        if node_performance:
            charts_data['node_performance'] = [
                {
                    'node': node_id,
                    'avg_duration': round(statistics.mean(durations), 2),
                    'executions': len(durations)
                }
                for node_id, durations in node_performance.items()
            ]
        
        return charts_data
    
    def _percentile(self, data: List[float], percentile: float) -> float:
        """Calculate percentile value from data"""
        if not data:
            return 0
        
        sorted_data = sorted(data)
        index = (percentile / 100) * (len(sorted_data) - 1)
        
        if index.is_integer():
            return sorted_data[int(index)]
        else:
            lower_index = int(index)
            upper_index = lower_index + 1
            weight = index - lower_index
            return sorted_data[lower_index] * (1 - weight) + sorted_data[upper_index] * weight
    
    def _categorize_error(self, error_message: str) -> str:
        """Categorize error message into error type"""
        
        error_message_lower = error_message.lower()
        
        if any(keyword in error_message_lower for keyword in ['timeout', 'time out', 'timed out']):
            return 'timeout'
        elif any(keyword in error_message_lower for keyword in ['connection', 'network', 'unreachable']):
            return 'connectivity'
        elif any(keyword in error_message_lower for keyword in ['validation', 'invalid', 'format']):
            return 'validation'
        elif any(keyword in error_message_lower for keyword in ['permission', 'unauthorized', 'forbidden']):
            return 'authorization'
        elif any(keyword in error_message_lower for keyword in ['memory', 'resource', 'limit']):
            return 'resource'
        else:
            return 'general'
    
    def _analyze_resource_metric(self, usage_data: List[float], resource_type: str) -> Dict[str, Any]:
        """Analyze resource usage metric"""
        
        if not usage_data:
            return None
        
        avg_usage = statistics.mean(usage_data)
        thresholds = self.thresholds['resource_usage'][resource_type]
        
        if avg_usage >= thresholds['critical']:
            classification = 'critical'
        elif avg_usage >= thresholds['high']:
            classification = 'high'
        elif avg_usage >= thresholds['normal']:
            classification = 'normal'
        else:
            classification = 'low'
        
        return {
            'average': round(avg_usage, 2),
            'peak': round(max(usage_data), 2),
            'minimum': round(min(usage_data), 2),
            'classification': classification,
            'samples': len(usage_data)
        }
    
    async def _matches_pattern(self, analysis_result: Dict[str, Any], indicators: List[str]) -> bool:
        """Check if analysis result matches optimization pattern indicators"""
        
        # Simple pattern matching - in production this would be more sophisticated
        for indicator in indicators:
            if 'avg_response_time > 2000' in indicator:
                timing = analysis_result.get('timing_analysis', {}).get('overall_timing', {})
                if timing.get('mean_ms', 0) > 2000:
                    return True
            elif 'error_rate > 0.05' in indicator:
                error_rate = analysis_result.get('error_analysis', {}).get('overall_error_rate', 0)
                if error_rate > 5:  # 5%
                    return True
            elif 'cpu_usage > 85' in indicator:
                cpu_analysis = analysis_result.get('resource_analysis', {}).get('cpu_analysis', {})
                if cpu_analysis and cpu_analysis.get('average', 0) > 85:
                    return True
        
        return False
    
    async def _analyze_trends(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance trends over time"""
        
        if len(logs) < 2:
            return {'trend_analysis': 'insufficient_data'}
        
        # Group logs by time periods and analyze trends
        recent_logs = logs[-10:] if len(logs) >= 10 else logs[-len(logs)//2:]
        older_logs = logs[:len(logs)//2] if len(logs) >= 10 else logs[:len(logs)//2]
        
        recent_durations = [log.get('duration_ms', 0) for log in recent_logs if log.get('duration_ms')]
        older_durations = [log.get('duration_ms', 0) for log in older_logs if log.get('duration_ms')]
        
        trends = {}
        
        if recent_durations and older_durations:
            recent_avg = statistics.mean(recent_durations)
            older_avg = statistics.mean(older_durations)
            
            if recent_avg > older_avg * 1.1:
                trends['performance_trend'] = 'degrading'
            elif recent_avg < older_avg * 0.9:
                trends['performance_trend'] = 'improving'
            else:
                trends['performance_trend'] = 'stable'
            
            trends['performance_change_percent'] = round(((recent_avg - older_avg) / older_avg) * 100, 1)
        
        return trends
    
    async def _generate_key_insights(self, timing_analysis, throughput_analysis, error_analysis, resource_analysis) -> List[str]:
        """Generate key insights from all analyses"""
        
        insights = []
        
        # Timing insights
        if timing_analysis.get('performance_rating') == 'excellent':
            insights.append("Pipeline performance is excellent with low latency")
        elif timing_analysis.get('performance_rating') == 'poor':
            insights.append("Pipeline performance needs improvement - high latency detected")
        
        # Error insights
        error_rate = error_analysis.get('overall_error_rate', 0)
        if error_rate < 1:
            insights.append("Error rate is within acceptable limits")
        elif error_rate > 10:
            insights.append("High error rate indicates reliability issues")
        
        # Throughput insights
        throughput_rating = throughput_analysis.get('throughput_rating')
        if throughput_rating == 'high':
            insights.append("High throughput indicates good capacity utilization")
        elif throughput_rating == 'low':
            insights.append("Low throughput may indicate bottlenecks or capacity constraints")
        
        # Resource insights
        if resource_analysis.get('resource_data_available'):
            if resource_analysis.get('overall_health') == 'healthy':
                insights.append("Resource utilization is healthy")
            elif resource_analysis.get('overall_health') == 'critical':
                insights.append("Critical resource usage detected - scaling recommended")
        
        return insights[:5]  # Return top 5 insights


# Function factory for pipeline system
async def analyze_pipeline_performance(input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pipeline function entry point for performance analysis.
    
    Args:
        input_data: Analysis parameters and execution logs
        context: Pipeline execution context
        
    Returns:
        Function execution result with performance analysis
    """
    analyzer = PipelinePerformanceAnalyzer()
    return await analyzer.execute(input_data, context)


# Export function metadata
FUNCTION_METADATA = {
    'id': 'analyzePipelinePerformance',
    'name': 'Analyze Pipeline Performance',
    'description': 'Analyzes pipeline execution performance and identifies bottlenecks',
    'version': '1.0.0',
    'input_schema': {
        'type': 'object',
        'properties': {
            'execution_logs': {
                'type': 'array',
                'description': 'Array of execution log data'
            },
            'analysis_type': {
                'type': 'string',
                'enum': ['timing', 'throughput', 'error_analysis', 'resource_usage'],
                'default': 'timing',
                'description': 'Type of analysis to perform'
            },
            'time_window': {
                'type': 'string',
                'description': 'Time window for analysis (e.g., "1h", "1d", "1w")',
                'default': '1h'
            }
        },
        'required': ['execution_logs']
    },
    'output_schema': {
        'type': 'object',
        'properties': {
            'performance_summary': {
                'type': 'object',
                'description': 'Summary of performance metrics'
            },
            'bottlenecks': {
                'type': 'array',
                'description': 'Identified performance bottlenecks'
            },
            'recommendations': {
                'type': 'array',
                'description': 'Optimization recommendations'
            },
            'charts_data': {
                'type': 'object',
                'description': 'Data for performance visualization charts'
            }
        }
    }
}