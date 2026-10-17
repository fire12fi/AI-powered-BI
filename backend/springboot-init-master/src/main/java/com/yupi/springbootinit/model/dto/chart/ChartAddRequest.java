package com.yupi.springbootinit.model.dto.chart;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 前端创建请求
 *
 */
@Data
public class ChartAddRequest implements Serializable {
    /**
     * 分析目标
     */
    private String goal;

    /**
     * 图表名称
     */
    private String name;

    /**
     * 图表数据
     */
    private String chartData;


    private static final long serialVersionUID = 1L;
}